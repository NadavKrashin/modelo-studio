export { AggregatingSearchService } from './search-service';
export { DefaultModelNormalizer } from './normalizer';
export { KeywordPopularityRanking } from './ranking';
export type { ScoredItem } from './ranking';
export { analyzeQuery, detectLanguage } from './query-analyzer';
export { inferCategories, detectCategoryFromQuery, CATEGORY_RULES } from './category-mapper';
export { deduplicate } from './deduplication';
export { InMemorySearchAnalytics } from './search-analytics';
export type {
  SearchBackend,
  SearchAnalyticsBackend,
  SearchAnalyticsStats,
  SearchEventInput,
  ClickEventInput,
} from './search-backend';
