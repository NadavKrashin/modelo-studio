import type { NormalizedModel, ModelSummary } from '@/lib/types';
import type { ModelSearchOptions, PaginatedResult } from '@/lib/repositories';

/**
 * SearchBackend — abstraction over the search/query layer.
 *
 * The CatalogStore implements this interface using in-memory filtering.
 * For production, create an ElasticsearchBackend that delegates to ES.
 *
 * Integration points for Elasticsearch:
 *  - Implement this interface with an ES client
 *  - Replace CatalogStore in ServiceContainer with the ES adapter
 *  - The rest of the stack (SearchService, CatalogService, API routes) stays unchanged
 *
 * Suggested ES index mapping:
 *  - name: text (analyzed, standard + hebrew analyzers)
 *  - localizedName: text (analyzed, hebrew analyzer)
 *  - description: text (analyzed)
 *  - tags: keyword[]
 *  - categories: keyword[]
 *  - popularityScore: float (used for function_score)
 *  - createdAt: date
 *  - availability: keyword
 *  - source.name: keyword
 */
export interface SearchBackend {
  search(query: string, options: ModelSearchOptions): PaginatedResult<ModelSummary>;

  findByCategory(categoryId: string, options: { page: number; pageSize: number }): PaginatedResult<ModelSummary>;

  findPopular(limit: number): ModelSummary[];

  get(id: string): NormalizedModel | null;

  getByExternalId(externalId: string, providerId: string): NormalizedModel | null;

  readonly size: number;
}

/**
 * SearchAnalyticsBackend — abstraction for search analytics persistence.
 *
 * The in-memory analytics backend implements this during local development.
 * For production, implement with a time-series DB or analytics pipeline.
 */
export interface SearchAnalyticsBackend {
  recordSearch(event: SearchEventInput): void;
  recordClick(event: ClickEventInput): void;
  getTopSearches(limit: number): SearchTermAggregate[];
  getZeroResultQueries(limit: number): ZeroResultQuery[];
  getClickThroughRate(): number;
  getStats(): SearchAnalyticsStats;
}

export interface SearchAnalyticsStats {
  totalSearches: number;
  totalClicks: number;
  uniqueTerms: number;
  clickThroughRate: number;
  zeroResultQueries: number;
}

export interface SearchEventInput {
  query: string;
  resultCount: number;
  language: 'he' | 'en' | 'mixed';
  providerQuery?: string;
  category?: string;
  page: number;
  durationMs?: number;
}

export interface ClickEventInput {
  query: string;
  modelId: string;
  position: number;
  source: string;
}

export interface SearchTermAggregate {
  term: string;
  count: number;
  avgResultCount: number;
  lastSearchedAt: string;
  zeroResultRate: number;
}

export interface ZeroResultQuery {
  term: string;
  count: number;
  lastSearchedAt: string;
  language: 'he' | 'en' | 'mixed';
}
