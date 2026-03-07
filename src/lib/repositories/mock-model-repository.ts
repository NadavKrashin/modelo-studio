import type { NormalizedModel, ModelSummary } from '@/lib/types';
import type { ModelRepository, ModelSearchOptions, PaginatedResult, PaginationParams } from './interfaces';
import { MOCK_MODELS } from '@/lib/db/mock-models';
import { KeywordPopularityRanking } from '@/lib/search/ranking';

const ranking = new KeywordPopularityRanking();

function toSummary(m: NormalizedModel): ModelSummary {
  return {
    id: m.id,
    name: m.name,
    localizedName: m.localizedName,
    thumbnailUrl: m.images[0]?.cachedUrl ?? m.images[0]?.url ?? '',
    category: m.categories[0] ?? '',
    sourceName: m.source.displayName,
    popularityScore: m.popularityScore,
    estimatedBasePrice: m.estimatedBasePrice,
    availability: m.availability,
    commercialUse: m.license.commercialUse,
  };
}

/**
 * In-memory model repository backed by MOCK_MODELS.
 * Replace with PostgreSQL/Elasticsearch implementation for production.
 */
export class MockModelRepository implements ModelRepository {
  private models: NormalizedModel[] = [...MOCK_MODELS];

  async findById(id: string): Promise<NormalizedModel | null> {
    return this.models.find((m) => m.id === id) ?? null;
  }

  async findByExternalId(externalId: string, sourceName: string): Promise<NormalizedModel | null> {
    return (
      this.models.find(
        (m) => m.externalId === externalId && m.source.name === sourceName
      ) ?? null
    );
  }

  async search(query: string, options: ModelSearchOptions): Promise<PaginatedResult<ModelSummary>> {
    let filtered = this.models.filter((m) => m.availability === 'available');

    if (options.category) {
      filtered = filtered.filter((m) => m.categories.includes(options.category!));
    }

    if (query.trim()) {
      filtered = ranking.rank(filtered, query);
    } else {
      filtered = this.applySorting(filtered, options.sortBy ?? 'popularity');
    }

    const total = filtered.length;
    const offset = (options.page - 1) * options.pageSize;
    const paged = filtered.slice(offset, offset + options.pageSize);

    return {
      items: paged.map(toSummary),
      total,
      page: options.page,
      pageSize: options.pageSize,
    };
  }

  async findByCategory(categoryId: string, pagination: PaginationParams): Promise<PaginatedResult<ModelSummary>> {
    const filtered = this.models.filter(
      (m) => m.categories.includes(categoryId) && m.availability === 'available'
    );
    const offset = (pagination.page - 1) * pagination.pageSize;
    return {
      items: filtered.slice(offset, offset + pagination.pageSize).map(toSummary),
      total: filtered.length,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }

  async findPopular(limit: number): Promise<ModelSummary[]> {
    return [...this.models]
      .filter((m) => m.availability === 'available')
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit)
      .map(toSummary);
  }

  async count(): Promise<number> {
    return this.models.length;
  }

  async upsert(model: NormalizedModel): Promise<NormalizedModel> {
    const idx = this.models.findIndex((m) => m.id === model.id);
    if (idx >= 0) {
      this.models[idx] = { ...model, updatedAt: new Date().toISOString() };
      return this.models[idx];
    }
    const newModel = { ...model, indexedAt: new Date().toISOString() };
    this.models.push(newModel);
    return newModel;
  }

  async bulkUpsert(models: NormalizedModel[]): Promise<number> {
    let count = 0;
    for (const model of models) {
      await this.upsert(model);
      count++;
    }
    return count;
  }

  async updateCacheState(id: string, state: NormalizedModel['cachedAssetState']): Promise<void> {
    const model = this.models.find((m) => m.id === id);
    if (model) {
      model.cachedAssetState = state;
      model.updatedAt = new Date().toISOString();
    }
  }

  private applySorting(models: NormalizedModel[], sortBy: string): NormalizedModel[] {
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
