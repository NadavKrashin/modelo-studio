import { BaseModelSourceProvider } from '../base-provider';
import type { SourceSearchOptions, ProviderResult, NormalizedModel } from '@/lib/types';
import type { ProviderConfig } from '@/lib/config/providers';
import { ProviderCache } from '../cache';
import { MMFClient, MMFApiError } from './client';
import { normalizeMMFObject } from './normalizer';

const TAG = '[MyMiniFactoryProvider]';

export class MyMiniFactoryProvider extends BaseModelSourceProvider {
  readonly id = 'myminifactory';
  readonly name = 'myminifactory';
  readonly displayName = 'MyMiniFactory';

  private client: MMFClient;
  private available: boolean | null = null;
  private availabilityCheckAt = 0;
  private static readonly AVAILABILITY_TTL = 60_000;

  constructor(config: ProviderConfig, cache: ProviderCache) {
    super();
    this.client = new MMFClient(config, cache);
  }

  async browse(options?: SourceSearchOptions): Promise<ProviderResult[]> {
    return this.search('popular', options);
  }

  async search(query: string, options?: SourceSearchOptions): Promise<ProviderResult[]> {
    if (!query.trim()) return [];

    try {
      const page = options?.offset ? Math.floor(options.offset / (options?.limit ?? 20)) + 1 : 1;
      const perPage = options?.limit ?? 20;
      const response = await this.client.search(query, page, perPage);

      const items = Array.isArray(response?.items) ? response.items : [];
      return items
        .filter((obj) => obj && typeof obj.id === 'number' && obj.visibility !== '0')
        .map((obj): ProviderResult => ({
          providerId: this.id,
          externalId: String(obj.id),
          model: normalizeMMFObject(obj),
        }));
    } catch (err) {
      this.logFailure('search', err, { query });
      return [];
    }
  }

  async getModel(externalId: string): Promise<ProviderResult | null> {
    try {
      const objectId = parseInt(externalId, 10);
      if (isNaN(objectId) || objectId <= 0) return null;

      const obj = await this.client.getObject(objectId);
      if (!obj || typeof obj.id !== 'number') return null;

      return {
        providerId: this.id,
        externalId: String(obj.id),
        model: normalizeMMFObject(obj),
      };
    } catch (err) {
      if (err instanceof MMFApiError && err.status === 404) return null;
      this.logFailure('getModel', err, { externalId });
      return null;
    }
  }

  async getPopularModels(limit = 8): Promise<NormalizedModel[]> {
    try {
      const response = await this.client.search('popular', 1, limit);
      const items = Array.isArray(response?.items) ? response.items : [];
      return items
        .filter((obj) => obj && typeof obj.id === 'number' && obj.visibility !== '0')
        .map((obj) => normalizeMMFObject(obj));
    } catch (err) {
      this.logFailure('getPopular', err);
      return [];
    }
  }

  warmUp(): void {
    this.isAvailable().catch(() => {});
  }

  async isAvailable(): Promise<boolean> {
    if (this.available !== null && Date.now() - this.availabilityCheckAt < MyMiniFactoryProvider.AVAILABILITY_TTL) {
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

  private logFailure(method: string, err: unknown, ctx?: Record<string, string>): void {
    const ctxStr = ctx ? ` ${JSON.stringify(ctx)}` : '';
    if (err instanceof MMFApiError) {
      console.error(
        `${TAG} ${method} failed: HTTP ${err.status}${err.retryable ? ' (retryable)' : ''} — ${err.message}${ctxStr}`,
      );
    } else {
      console.error(`${TAG} ${method} failed: ${(err as Error).message}${ctxStr}`);
    }
  }
}
