import type { CatalogEntry, ProviderResult, NormalizedModel } from '@/lib/types';
import { isStorefrontEligible, storefrontEligibilityReason } from '@/lib/types/model';
import { isStale, CATALOG_DEFAULTS } from '@/lib/types/catalog';
import type { ProviderRegistry } from '@/lib/providers/registry';
import type { CatalogStore } from './catalog-store';
import type { FirestoreCatalogCache } from './firestore-catalog-cache';

const TAG = '[CatalogService]';

/**
 * Orchestrates the pipeline between external providers and the internal
 * catalog store.
 *
 * Responsibilities:
 *  - Convert ProviderResult → CatalogEntry (normalize + wrap with metadata)
 *  - Ingest search/popular results into the store
 *  - Fetch individual models with stale-while-revalidate logic
 *  - Background refresh of stale entries
 */
export class CatalogService {
  constructor(
    private store: CatalogStore,
    private registry: ProviderRegistry,
    private persistence?: FirestoreCatalogCache,
  ) {}

  // ─── Ingestion ─────────────────────────────────────────────

  /**
   * Converts provider results to catalog entries and upserts them.
   * Returns the created/updated entries.
   */
  ingest(results: ProviderResult[]): CatalogEntry[] {
    if (results.length === 0) return [];

    const entries = results.map((r) => this.toEntry(r));
    this.store.bulkUpsert(entries);
    this.persistEntries(entries);
    return entries;
  }

  /**
   * Ingests a batch of NormalizedModels from a specific provider.
   * Used for popular-model fetches and other non-search ingestion.
   */
  ingestNormalized(providerId: string, models: NormalizedModel[]): CatalogEntry[] {
    const results: ProviderResult[] = models.map((model) => ({
      providerId,
      externalId: model.externalId,
      model,
    }));
    return this.ingest(results);
  }

  // ─── Fetch ─────────────────────────────────────────────────

  /**
   * Fetches a model by catalog ID. Returns from the store if fresh,
   * otherwise tries to refresh from the provider.
   *
   * Implements stale-while-revalidate: returns the stale entry immediately
   * and refreshes in the background.
   */
  async getModel(id: string): Promise<CatalogEntry | null> {
    const cached = this.store.get(id);

    if (cached) {
      const pid = cached.catalog.providerId;
      const needsLicenseEnrichment = cached.license.commercialUse === 'unknown'
        && !!pid;

      if (!isStorefrontEligible(cached, pid)) {
        if (cached.license.commercialUse === 'restricted') {
          if (process.env.NODE_ENV === 'development') {
            console.log(`${TAG} ${storefrontEligibilityReason(cached, pid)} — "${cached.name}" (${id})`);
          }
          return null;
        }

        if (needsLicenseEnrichment) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`${TAG} Model "${cached.name}" (${id}) has unknown license — enriching from provider`);
          }
          const enriched = await this.enrichFromProvider(cached);
          const final = enriched ?? cached;
          if (!isStorefrontEligible(final, pid)) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`${TAG} ${storefrontEligibilityReason(final, pid)} — "${final.name}" (${id})`);
            }
            return null;
          }
          this.store.recordView(id);
          return final;
        }

        return null;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`${TAG} ${storefrontEligibilityReason(cached, pid)} — "${cached.name}" (${id})`);
      }

      this.store.recordView(id);

      if (!isStale(cached)) {
        return cached;
      }

      this.refreshEntryInBackground(cached);

      if (cached.catalog.importStatus === 'discovered' || cached.catalog.importStatus === 'metadata_cached') {
        const enriched = await this.enrichFromProvider(cached);
        if (enriched && !isStorefrontEligible(enriched, pid)) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`${TAG} Re-validated "${enriched.name}" no longer eligible — ${storefrontEligibilityReason(enriched, pid)}`);
          }
          return null;
        }
        return enriched ?? cached;
      }

      return cached;
    }

    const persisted = await this.loadFromPersistence(id);
    if (persisted) {
      this.store.upsert(persisted);
      this.store.recordView(id);
      if (process.env.NODE_ENV === 'development') {
        console.log(`${TAG} Cache hit in Firestore for "${persisted.name}" (${id})`);
      }
      return persisted;
    }

    const fetched = await this.fetchFromProviders(id);
    if (fetched && !isStorefrontEligible(fetched, fetched.catalog.providerId)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`${TAG} Fetched "${fetched.name}" (${id}) — ${storefrontEligibilityReason(fetched, fetched.catalog.providerId)}`);
      }
      return null;
    }
    return fetched;
  }

  // ─── Refresh ───────────────────────────────────────────────

  /**
   * Finds stale catalog entries and refreshes them from their providers.
   * Intended to be called periodically (e.g., in a cron-like process).
   */
  async refreshStale(limit = 20): Promise<number> {
    const stale = this.store.getStale(limit);
    if (stale.length === 0) return 0;

    let refreshed = 0;

    for (const entry of stale) {
      try {
        const provider = this.registry.get(entry.catalog.providerId);
        if (!provider) {
          this.store.upsert(entry);
          this.persistEntry(entry);
          continue;
        }

        const result = await provider.getModel(entry.externalId);
        if (result) {
          const fresh = this.toEntry(result);
          fresh.catalog.importStatus = entry.catalog.importStatus;
          fresh.catalog.viewCount = entry.catalog.viewCount;
          this.store.upsert(fresh);
          this.persistEntry(fresh);
          refreshed++;
        }
      } catch (err) {
        console.warn(`${TAG} Failed to refresh ${entry.id}:`, (err as Error).message);
      }
    }

    if (refreshed > 0) {
      console.log(`${TAG} Refreshed ${refreshed}/${stale.length} stale entries`);
    }

    return refreshed;
  }

  // ─── Diagnostics ───────────────────────────────────────────

  getStats() {
    return {
      totalEntries: this.store.size,
      staleEntries: this.store.staleCount(),
      commerciallyExcluded: this.store.commerciallyExcludedCount(),
      byProvider: this.store.countByProvider(),
    };
  }

  // ─── Internal ──────────────────────────────────────────────

  /** Converts a ProviderResult into a CatalogEntry. */
  private toEntry(result: ProviderResult): CatalogEntry {
    return {
      ...result.model,
      catalog: {
        providerId: result.providerId,
        importedAt: new Date().toISOString(),
        lastRefreshedAt: new Date().toISOString(),
        staleAfterMs: CATALOG_DEFAULTS.externalStaleTtlMs,
        importStatus: 'metadata_cached',
        viewCount: 0,
      },
    };
  }

  /**
   * Tries to fetch a model from the matching external provider by
   * parsing the catalog ID format (e.g., 'thingiverse-12345').
   */
  private async fetchFromProviders(id: string): Promise<CatalogEntry | null> {
    // Parse provider-prefixed IDs like 'thingiverse-12345'
    const dashIdx = id.indexOf('-');
    if (dashIdx > 0) {
      const prefix = id.substring(0, dashIdx);
      const externalId = id.substring(dashIdx + 1);
      const provider = this.registry.get(prefix);
      if (provider) {
        try {
          const result = await provider.getModel(externalId);
          if (result) {
            const entry = this.toEntry(result);
            this.store.upsert(entry);
            this.persistEntry(entry);
            this.store.recordView(entry.id);
            return entry;
          }
        } catch (err) {
          console.warn(`${TAG} Fetch from ${prefix} failed for "${id}":`, (err as Error).message);
        }
      }
    }

    // Brute-force search across external providers
    for (const provider of this.registry.getExternal()) {
      try {
        const result = await provider.getModel(id);
        if (result) {
          const entry = this.toEntry(result);
          this.store.upsert(entry);
          this.persistEntry(entry);
          this.store.recordView(entry.id);
          return entry;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Tries to enrich a shallow entry (discovered/metadata_cached) by
   * fetching full details from the provider.
   */
  private async enrichFromProvider(entry: CatalogEntry): Promise<CatalogEntry | null> {
    const provider = this.registry.get(entry.catalog.providerId);
    if (!provider) return null;

    try {
      const result = await provider.getModel(entry.externalId);
      if (!result) return null;

      const enriched = this.toEntry(result);
      enriched.catalog.importStatus = 'metadata_cached';
      enriched.catalog.viewCount = entry.catalog.viewCount;
      enriched.catalog.importedAt = entry.catalog.importedAt;
      this.store.upsert(enriched);
      this.persistEntry(enriched);
      return enriched;
    } catch {
      return null;
    }
  }

  private refreshEntryInBackground(entry: CatalogEntry): void {
    const provider = this.registry.get(entry.catalog.providerId);
    if (!provider) return;

    provider.getModel(entry.externalId).then((result) => {
      if (result) {
        const fresh = this.toEntry(result);
        fresh.catalog.importStatus = entry.catalog.importStatus;
        fresh.catalog.viewCount = entry.catalog.viewCount;
        fresh.catalog.importedAt = entry.catalog.importedAt;
        this.store.upsert(fresh);
        this.persistEntry(fresh);
      }
    }).catch(() => {});
  }

  private async loadFromPersistence(id: string): Promise<CatalogEntry | null> {
    if (!this.persistence) return null;
    try {
      return await this.persistence.findById(id);
    } catch (err) {
      console.warn(`${TAG} Firestore cache read failed for "${id}":`, (err as Error).message);
      return null;
    }
  }

  private persistEntries(entries: CatalogEntry[]): void {
    if (!this.persistence || entries.length === 0) return;
    this.persistence.upsertEntries(entries).catch((err) => {
      console.warn(`${TAG} Firestore cache batch write failed:`, (err as Error).message);
    });
  }

  private persistEntry(entry: CatalogEntry): void {
    if (!this.persistence) return;
    this.persistence.upsertEntry(entry).catch((err) => {
      console.warn(`${TAG} Firestore cache write failed for "${entry.id}":`, (err as Error).message);
    });
  }
}
