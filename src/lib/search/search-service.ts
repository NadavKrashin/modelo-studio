import type {
  SearchProvider,
  SearchQuery,
  SearchResult,
  SearchSuggestion,
  NormalizedModel,
  ModelSourceProvider,
  ModelSummary,
} from '@/lib/types';
import { KeywordPopularityRanking } from './ranking';

/**
 * @deprecated Use the main SearchService in lib/services instead.
 *
 * Legacy aggregating search service kept for reference. The active
 * code path now uses CatalogStore + CatalogService + SearchService.
 */
export class AggregatingSearchService implements SearchProvider {
  private providers: ModelSourceProvider[];
  private ranking: KeywordPopularityRanking;

  constructor(providers: ModelSourceProvider[]) {
    this.providers = providers;
    this.ranking = new KeywordPopularityRanking();
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();

    const providerResults = await Promise.allSettled(
      this.providers.map((provider) =>
        provider.search(query.query, {
          limit: query.pageSize,
          offset: (query.page - 1) * query.pageSize,
          category: query.category,
        })
      )
    );

    const allNormalized: NormalizedModel[] = [];
    const activeSources: string[] = [];

    providerResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        activeSources.push(this.providers[idx].displayName);
        for (const pr of result.value) {
          allNormalized.push(pr.model);
        }
      }
    });

    const ranked = this.ranking.rank(allNormalized, query.query);

    const paged = ranked.slice(0, query.pageSize);
    const items: ModelSummary[] = paged.map((model) => ({
      id: model.id,
      name: model.name,
      localizedName: model.localizedName,
      thumbnailUrl: model.images[0]?.cachedUrl ?? model.images[0]?.url ?? '',
      category: model.categories[0] ?? '',
      sourceName: model.source.displayName,
      popularityScore: model.popularityScore,
      estimatedBasePrice: model.estimatedBasePrice,
      availability: model.availability,
      commercialUse: model.license.commercialUse,
    }));

    return {
      items,
      totalCount: allNormalized.length,
      page: query.page,
      pageSize: query.pageSize,
      query: query.query,
      appliedCategory: query.category,
      searchTimeMs: Date.now() - startTime,
      sources: activeSources,
    };
  }

  async suggest(partial: string): Promise<SearchSuggestion[]> {
    if (!partial.trim()) return [];
    const results = await this.providers[0]?.search(partial, { limit: 5 });
    if (!results) return [];

    return results.slice(0, 5).map((pr) => ({
      text: pr.model.name ?? pr.externalId,
      type: 'model' as const,
      localizedText: pr.model.localizedName ?? pr.externalId,
    }));
  }

  async getById(id: string): Promise<NormalizedModel | null> {
    for (const provider of this.providers) {
      const result = await provider.getModel(id);
      if (result) return result.model;
    }
    return null;
  }
}
