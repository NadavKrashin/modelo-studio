import type { CatalogEntry, NormalizedModel, ModelSummary } from '@/lib/types';
import { isCommerciallyUsable } from '@/lib/types/model';
import { isStale } from '@/lib/types/catalog';
import type { PaginationParams, ModelSearchOptions, PaginatedResult } from '@/lib/repositories';
import type { SearchBackend } from '@/lib/search/search-backend';
import { KeywordPopularityRanking } from '@/lib/search/ranking';

const TAG = '[CatalogStore]';
const ranking = new KeywordPopularityRanking();

/**
 * In-memory catalog store — the single source of truth for model metadata.
 *
 * Implements SearchBackend so it can be swapped with an Elasticsearch
 * adapter without changing the rest of the stack.
 *
 * Starts empty. All entries come from real external providers
 * (Thingiverse, MyMiniFactory, etc.) via upsert() / bulkUpsert().
 */
export class CatalogStore implements SearchBackend {
  private entries = new Map<string, CatalogEntry>();
  /** Secondary index: externalId+providerId → catalog id */
  private externalIndex = new Map<string, string>();

  constructor() {
    console.log(`${TAG} Initialized — empty catalog (real provider data only)`);
  }

  // ─── Read (SearchBackend) ─────────────────────────────────

  get(id: string): CatalogEntry | null {
    return this.entries.get(id) ?? null;
  }

  getForStorefront(id: string): CatalogEntry | null {
    const entry = this.entries.get(id);
    if (!entry) return null;
    if (entry.availability !== 'available' || !isCommerciallyUsable(entry)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `${TAG} Storefront access denied for "${entry.name}" (${entry.id}) — commercial use: ${entry.license.commercialUse}`,
        );
      }
      return null;
    }
    return entry;
  }

  getByExternalId(externalId: string, providerId: string): CatalogEntry | null {
    const key = `${providerId}:${externalId}`;
    const id = this.externalIndex.get(key);
    if (!id) return null;
    return this.entries.get(id) ?? null;
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  search(query: string, options: ModelSearchOptions): PaginatedResult<ModelSummary> {
    let models = this.allAvailable();

    if (options.category) {
      models = models.filter((m) => m.categories.includes(options.category!));
    }

    if (query.trim()) {
      models = ranking.rank(models, query);
    } else {
      models = this.applySorting(models, options.sortBy ?? 'popularity');
    }

    const total = models.length;
    const offset = (options.page - 1) * options.pageSize;
    const paged = models.slice(offset, offset + options.pageSize);

    return {
      items: paged.map(toSummary),
      total,
      page: options.page,
      pageSize: options.pageSize,
    };
  }

  findByCategory(categoryId: string, pagination: PaginationParams): PaginatedResult<ModelSummary> {
    const filtered = this.allAvailable().filter((m) => m.categories.includes(categoryId));
    const offset = (pagination.page - 1) * pagination.pageSize;
    return {
      items: filtered.slice(offset, offset + pagination.pageSize).map(toSummary),
      total: filtered.length,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }

  findPopular(limit: number): ModelSummary[] {
    return this.allAvailable()
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit)
      .map(toSummary);
  }

  /** Returns entries that are past their stale deadline. */
  getStale(limit = 50): CatalogEntry[] {
    const stale: CatalogEntry[] = [];
    for (const entry of this.entries.values()) {
      if (isStale(entry)) {
        stale.push(entry);
        if (stale.length >= limit) break;
      }
    }
    return stale;
  }

  // ─── Write ─────────────────────────────────────────────────

  upsert(entry: CatalogEntry): CatalogEntry {
    const now = new Date().toISOString();
    const existing = this.entries.get(entry.id);

    if (existing) {
      const merged: CatalogEntry = {
        ...entry,
        catalog: {
          ...entry.catalog,
          importedAt: existing.catalog.importedAt,
          lastRefreshedAt: now,
          viewCount: existing.catalog.viewCount,
        },
        updatedAt: now,
      };
      this.entries.set(entry.id, merged);
      this.indexExternal(merged);
      return merged;
    }

    const created: CatalogEntry = {
      ...entry,
      catalog: { ...entry.catalog, importedAt: now, lastRefreshedAt: now },
      indexedAt: now,
    };
    this.entries.set(entry.id, created);
    this.indexExternal(created);
    return created;
  }

  bulkUpsert(entries: CatalogEntry[]): number {
    let count = 0;
    for (const entry of entries) {
      this.upsert(entry);
      count++;
    }
    return count;
  }

  recordView(id: string): void {
    const entry = this.entries.get(id);
    if (entry) {
      entry.catalog.viewCount++;
    }
  }

  updateImportStatus(id: string, status: CatalogEntry['catalog']['importStatus']): void {
    const entry = this.entries.get(id);
    if (entry) {
      entry.catalog.importStatus = status;
      entry.updatedAt = new Date().toISOString();
    }
  }

  // ─── Stats ─────────────────────────────────────────────────

  get size(): number {
    return this.entries.size;
  }

  countByProvider(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const entry of this.entries.values()) {
      counts[entry.catalog.providerId] = (counts[entry.catalog.providerId] ?? 0) + 1;
    }
    return counts;
  }

  staleCount(): number {
    let count = 0;
    for (const entry of this.entries.values()) {
      if (isStale(entry)) count++;
    }
    return count;
  }

  commerciallyExcludedCount(): number {
    let count = 0;
    for (const entry of this.entries.values()) {
      if (entry.availability === 'available' && !isCommerciallyUsable(entry)) count++;
    }
    return count;
  }

  countByCategory(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const entry of this.allAvailable()) {
      for (const cat of entry.categories) {
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
    }
    return counts;
  }

  getExcludedModels(): Array<{ id: string; name: string; license: string; commercialUse: string; reason: string }> {
    const excluded: Array<{ id: string; name: string; license: string; commercialUse: string; reason: string }> = [];
    for (const entry of this.entries.values()) {
      if (entry.availability === 'available' && !isCommerciallyUsable(entry)) {
        excluded.push({
          id: entry.id,
          name: entry.name,
          license: entry.license.spdxId,
          commercialUse: entry.license.commercialUse,
          reason: entry.license.commercialUseReason ?? 'No reason provided',
        });
      }
    }
    return excluded;
  }

  // ─── Internal ──────────────────────────────────────────────

  private allAvailable(): CatalogEntry[] {
    return [...this.entries.values()].filter((m) => {
      if (m.availability !== 'available') return false;
      if (!isCommerciallyUsable(m)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `${TAG} Excluded model "${m.name}" (${m.id}) — commercial use: ${m.license.commercialUse}, reason: ${m.license.commercialUseReason ?? m.license.spdxId}`,
          );
        }
        return false;
      }
      return true;
    });
  }

  private indexExternal(entry: CatalogEntry): void {
    const key = `${entry.catalog.providerId}:${entry.externalId}`;
    this.externalIndex.set(key, entry.id);
  }

  private applySorting(models: CatalogEntry[], sortBy: string): CatalogEntry[] {
    const copy = [...models];
    switch (sortBy) {
      case 'popularity':
        return copy.sort((a, b) => b.popularityScore - a.popularityScore);
      case 'price_asc':
        return copy.sort((a, b) => a.estimatedBasePrice - b.estimatedBasePrice);
      case 'price_desc':
        return copy.sort((a, b) => b.estimatedBasePrice - a.estimatedBasePrice);
      case 'newest':
        return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      default:
        return copy;
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────

function toSummary(m: NormalizedModel): ModelSummary {
  const img = m.images[0];
  return {
    id: m.id,
    name: m.name,
    localizedName: m.localizedName,
    thumbnailUrl: img?.mediumUrl ?? img?.cachedUrl ?? img?.url ?? '',
    category: m.categories[0] ?? '',
    sourceName: m.source.displayName,
    popularityScore: m.popularityScore,
    estimatedBasePrice: m.estimatedBasePrice,
    availability: m.availability,
    commercialUse: m.license.commercialUse,
    lowResThumbnailUrl: img?.thumbnailUrl,
    mediumImageUrl: img?.mediumUrl,
  };
}
