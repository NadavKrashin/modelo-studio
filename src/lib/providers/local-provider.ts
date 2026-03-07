import { BaseModelSourceProvider } from './base-provider';
import type { SourceSearchOptions, ProviderResult } from '@/lib/types';

/**
 * Local provider stub — returns no results.
 *
 * In a future production deployment this would query a local
 * PostgreSQL/Elasticsearch index. Currently all catalog data
 * comes from real external providers only.
 */
export class LocalModelSourceProvider extends BaseModelSourceProvider {
  readonly id = 'local';
  readonly name = 'local';
  readonly displayName = 'Modelo Index';

  async search(_query: string, _options?: SourceSearchOptions): Promise<ProviderResult[]> {
    return [];
  }

  async getModel(_externalId: string): Promise<ProviderResult | null> {
    return null;
  }
}
