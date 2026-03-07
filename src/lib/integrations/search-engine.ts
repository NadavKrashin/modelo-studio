/**
 * Elasticsearch / OpenSearch integration point.
 *
 * When ready:
 * 1. Install: `npm install @elastic/elasticsearch`
 * 2. Create an ElasticsearchModelRepository implementing ModelRepository
 * 3. Swap in the container
 *
 * Index mappings needed:
 *   - models: full-text on name + localizedName + description, keyword on categories,
 *     numeric on estimatedBasePrice + popularityScore, date on createdAt
 *
 * Suggested analyzers:
 *   - hebrew_analyzer: standard tokenizer + hebrew stemmer + lowercase
 *   - english_analyzer: standard tokenizer + english stemmer + lowercase
 *   - autocomplete: edge_ngram (2-15 chars) for search-as-you-type
 */

export interface SearchEngineConfig {
  node: string;
  auth?: { username: string; password: string } | { apiKey: string };
  indexPrefix?: string;
}

export interface SearchEngineClient {
  index(indexName: string, id: string, document: Record<string, unknown>): Promise<void>;
  search<T>(indexName: string, query: Record<string, unknown>): Promise<{
    hits: { id: string; score: number; source: T }[];
    total: number;
  }>;
  delete(indexName: string, id: string): Promise<void>;
  bulk(operations: BulkOperation[]): Promise<{ errors: boolean; took: number }>;
  createIndex(indexName: string, settings: Record<string, unknown>): Promise<void>;
}

export interface BulkOperation {
  action: 'index' | 'delete';
  index: string;
  id: string;
  document?: Record<string, unknown>;
}

export function createSearchEngineClient(_config: SearchEngineConfig): SearchEngineClient {
  throw new Error(
    'Elasticsearch is not configured. Set ELASTICSEARCH_URL in environment variables.'
  );
}
