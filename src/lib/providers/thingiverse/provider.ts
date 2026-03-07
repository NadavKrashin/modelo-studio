import { BaseModelSourceProvider } from '../base-provider';
import type { SourceSearchOptions, ProviderResult, NormalizedModel } from '@/lib/types';
import type { ProviderConfig } from '@/lib/config/providers';
import { ProviderCache } from '../cache';
import { ThingiverseClient, ThingiverseApiError } from './client';
import { normalizeThing } from './normalizer';

const TAG = '[ThingiverseProvider]';

export class ThingiverseProvider extends BaseModelSourceProvider {
  readonly id = 'thingiverse';
  readonly name = 'thingiverse';
  readonly displayName = 'Thingiverse';

  private client: ThingiverseClient;
  private available: boolean | null = null;
  private availabilityCheckAt = 0;
  private static readonly AVAILABILITY_TTL = 60_000;

  constructor(config: ProviderConfig, cache: ProviderCache) {
    super();
    this.client = new ThingiverseClient(config, cache);
  }

  // ─── Search ────────────────────────────────────────────────

  async search(query: string, options?: SourceSearchOptions): Promise<ProviderResult[]> {
    if (!query.trim()) return [];

    try {
      const page = options?.offset ? Math.floor(options.offset / (options?.limit ?? 20)) + 1 : 1;
      const perPage = options?.limit ?? 20;
      const response = await this.client.search(query, page, perPage);

      const hits = Array.isArray(response?.hits) ? response.hits : [];
      return hits
        .filter((hit) => hit && typeof hit.id === 'number' && hit.is_published !== false && !hit.is_wip)
        .map((hit): ProviderResult => ({
          providerId: this.id,
          externalId: String(hit.id),
          model: normalizeThing(hit),
        }));
    } catch (err) {
      this.logFailure('search', err, { query });
      return [];
    }
  }

  // ─── Model Details ─────────────────────────────────────────

  async getModel(externalId: string): Promise<ProviderResult | null> {
    try {
      const thingId = parseInt(externalId, 10);
      if (isNaN(thingId) || thingId <= 0) return null;

      const [thing, images] = await Promise.all([
        this.client.getThing(thingId),
        this.client.getThingImages(thingId).catch(() => []),
      ]);

      if (!thing || typeof thing.id !== 'number') return null;

      return {
        providerId: this.id,
        externalId: String(thing.id),
        model: normalizeThing(thing, images),
      };
    } catch (err) {
      if (err instanceof ThingiverseApiError && err.status === 404) return null;
      this.logFailure('getModel', err, { externalId });
      return null;
    }
  }

  // ─── License enrichment ────────────────────────────────────

  /**
   * Fetches full /things/{id} details for candidates whose search-result
   * payload lacked license metadata. Runs up to CONCURRENCY fetches in
   * parallel and caps at MAX_ENRICH candidates per call.
   */
  async enrichCandidates(candidates: ProviderResult[]): Promise<Map<string, ProviderResult>> {
    const MAX_ENRICH = 12;
    const CONCURRENCY = 4;
    const enriched = new Map<string, ProviderResult>();

    const toEnrich = candidates.slice(0, MAX_ENRICH);
    if (toEnrich.length === 0) return enriched;

    const batches: ProviderResult[][] = [];
    for (let i = 0; i < toEnrich.length; i += CONCURRENCY) {
      batches.push(toEnrich.slice(i, i + CONCURRENCY));
    }

    for (const batch of batches) {
      const results = await Promise.allSettled(
        batch.map(async (candidate) => {
          try {
            const detail = await this.getModel(candidate.externalId);
            if (detail) {
              enriched.set(candidate.externalId, detail);
            }
          } catch (err) {
            console.warn(`${TAG} enrichCandidates: failed for ${candidate.externalId}:`, (err as Error).message);
          }
        }),
      );
      void results;
    }

    return enriched;
  }

  // ─── Browse (no query) ────────────────────────────────────

  async browse(options?: SourceSearchOptions): Promise<ProviderResult[]> {
    try {
      const limit = options?.limit ?? 24;
      const offset = options?.offset ?? 0;
      const page = Math.floor(offset / limit) + 1;
      const things = await this.client.getPopular(page, limit);
      const items = Array.isArray(things) ? things : [];
      return items
        .filter((t) => t && typeof t.id === 'number' && t.is_published !== false && !t.is_wip)
        .map((t): ProviderResult => ({
          providerId: this.id,
          externalId: String(t.id),
          model: normalizeThing(t),
        }));
    } catch (err) {
      this.logFailure('browse', err);
      return [];
    }
  }

  // ─── Popular (returns NormalizedModel for convenience) ─────

  async getPopularModels(limit = 8): Promise<NormalizedModel[]> {
    try {
      const things = await this.client.getPopular(1, limit);
      const items = Array.isArray(things) ? things : [];
      return items
        .filter((t) => t && typeof t.id === 'number' && t.is_published !== false && !t.is_wip)
        .map((t) => normalizeThing(t));
    } catch (err) {
      this.logFailure('getPopular', err);
      return [];
    }
  }

  // ─── Availability ─────────────────────────────────────────

  warmUp(): void {
    this.isAvailable().catch(() => {});
  }

  async isAvailable(): Promise<boolean> {
    if (this.available !== null && Date.now() - this.availabilityCheckAt < ThingiverseProvider.AVAILABILITY_TTL) {
      return this.available;
    }
    this.available = await this.client.isReachable();
    this.availabilityCheckAt = Date.now();
    if (!this.available) {
      console.warn(`${TAG} API is not reachable (circuit: ${this.client.circuitState})`);
    }
    return this.available;
  }

  get circuitState(): string {
    return this.client.circuitState;
  }

  // ─── Internal ─────────────────────────────────────────────

  private logFailure(method: string, err: unknown, ctx?: Record<string, string>): void {
    const ctxStr = ctx ? ` ${JSON.stringify(ctx)}` : '';
    if (err instanceof ThingiverseApiError) {
      console.error(
        `${TAG} ${method} failed: HTTP ${err.status}${err.retryable ? ' (retryable)' : ''} — ${err.message}${ctxStr}`,
      );
    } else {
      console.error(`${TAG} ${method} failed: ${(err as Error).message}${ctxStr}`);
    }
  }
}
