import type { ModelSummary, NormalizedModel } from './model';
import type { ProviderResult } from './catalog';

// ─── Search types ───────────────────────────────────────────

export interface SearchQuery {
  query: string;
  category?: string;
  page: number;
  pageSize: number;
  sortBy?: SearchSortOption;
}

export type SearchSortOption = 'relevance' | 'popularity' | 'price_asc' | 'price_desc' | 'newest';

export interface SearchResult {
  items: ModelSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  query: string;
  appliedCategory?: string;
  searchTimeMs: number;
  sources: string[];
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'category' | 'model';
  localizedText: string;
}

// ─── Provider interface ─────────────────────────────────────

/**
 * Contract for all model source providers (local, Thingiverse, etc.).
 *
 * Providers normalize their own raw API data into a ProviderResult —
 * a typed boundary that the catalog layer converts to CatalogEntry.
 */
export interface ModelSourceProvider {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;

  search(query: string, options?: SourceSearchOptions): Promise<ProviderResult[]>;
  getModel(externalId: string): Promise<ProviderResult | null>;
  isAvailable(): Promise<boolean>;

  /**
   * Browse popular/trending models when no search query is provided.
   * Used for homepage, category-only browsing, and "show all" views.
   */
  browse?(options?: SourceSearchOptions): Promise<ProviderResult[]>;

  /**
   * Fetch full model details for candidates whose license metadata is
   * missing from the search payload. Returns enriched ProviderResults
   * keyed by externalId. Providers that include license data in search
   * results do not need to implement this.
   */
  enrichCandidates?(candidates: ProviderResult[]): Promise<Map<string, ProviderResult>>;
}

export interface SourceSearchOptions {
  limit?: number;
  offset?: number;
  category?: string;
}

// ─── Legacy types (kept for old search module) ──────────────

/** @deprecated Use ProviderResult instead. */
export interface RawModelData {
  [key: string]: unknown;
  externalId: string;
  sourceName: string;
}

export interface SearchRankingStrategy {
  rank<T extends NormalizedModel>(items: T[], query: string): T[];
}

export interface SearchProvider {
  search(query: SearchQuery): Promise<SearchResult>;
  suggest(partial: string): Promise<SearchSuggestion[]>;
  getById(id: string): Promise<NormalizedModel | null>;
}

export interface ModelNormalizer {
  normalize(raw: RawModelData, source: ModelSourceProvider): NormalizedModel;
  canNormalize(raw: RawModelData): boolean;
}

export interface MetadataEnrichmentService {
  enrich(model: NormalizedModel): Promise<NormalizedModel>;
}
