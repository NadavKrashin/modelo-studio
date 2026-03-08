import type { NormalizedModel, ModelSummary, CatalogEntry, ProviderResult } from '@/lib/types';
import { isStorefrontEligible, storefrontEligibilityReason } from '@/lib/types/model';
import type { ModelSearchOptions, PaginatedResult, PaginationParams, SearchMeta } from '@/lib/repositories';
import type { AnalyticsRepository } from '@/lib/repositories';
import type { ProviderRegistry } from '@/lib/providers/registry';
import type { CatalogStore } from '@/lib/catalog/catalog-store';
import type { CatalogService } from '@/lib/catalog/catalog-service';
import type { SearchAnalyticsBackend } from '@/lib/search/search-backend';
import { analyzeQuery } from '@/lib/search/query-analyzer';
import { deduplicate } from '@/lib/search/deduplication';
import { KeywordPopularityRanking } from '@/lib/search/ranking';

const TAG = '[SearchService]';
const ranking = new KeywordPopularityRanking();

/**
 * High-level search service with federated provider support.
 *
 * Search flow:
 *  1. Analyze the query (language detection, token expansion, provider query)
 *  2. Query the CatalogStore (fast — in-memory normalized data)
 *  3. Query external providers via Registry in parallel (using provider query)
 *  4. Ingest external results into the CatalogStore via CatalogService
 *  5. Deduplicate merged results
 *  6. Rank merged results by relevance (not just popularity)
 *  7. Record search analytics
 *  8. Fall back to catalog-only if external providers are unavailable
 */
export class SearchService {
  constructor(
    private catalogStore: CatalogStore,
    private catalogService: CatalogService,
    private analytics: AnalyticsRepository,
    private searchAnalytics: SearchAnalyticsBackend,
    private registry?: ProviderRegistry,
  ) {}

  // ─── Search ────────────────────────────────────────────────

  async search(
    query: string,
    options: Partial<ModelSearchOptions> = {},
  ): Promise<PaginatedResult<ModelSummary>> {
    const startMs = Date.now();
    const analyzed = analyzeQuery(query);

    const resolved: ModelSearchOptions = {
      page: options.page ?? 1,
      pageSize: Math.min(options.pageSize ?? 20, 50),
      category: options.category,
      sortBy: options.sortBy ?? 'relevance',
    };

    if (analyzed.normalized) {
      await this.analytics.recordSearchTerm(analyzed.normalized).catch(() => {});
    }

    const localQueryScopedEntries = this.catalogStore.getQueryScopedEntries(query, resolved.sortBy);
    const localQueryScopedSummaries = localQueryScopedEntries.map(toSummary);
    const localDisplayedSummaries = resolved.category
      ? localQueryScopedSummaries.filter((item) => item.category === resolved.category)
      : localQueryScopedSummaries;
    const localResult = paginateSummaries(localDisplayedSummaries, resolved.page, resolved.pageSize);
    const queryScopedCategoryCounts = this.computeCategoryCounts(localQueryScopedSummaries);

    const localOnlyMeta: SearchMeta = {
      externalProvidersQueried: 0,
      externalProvidersAvailable: 0,
      externalResultCount: 0,
      localOnly: true,
    };

    if (!this.registry) {
      localOnlyMeta.categoryCounts = queryScopedCategoryCounts;
      this.recordSearchAnalytics(analyzed, localResult.total, startMs, resolved);
      return { ...localResult, meta: localOnlyMeta };
    }

    const externalProviders = this.registry.getExternal();
    if (externalProviders.length === 0) {
      localOnlyMeta.categoryCounts = queryScopedCategoryCounts;
      this.recordSearchAnalytics(analyzed, localResult.total, startMs, resolved);
      return { ...localResult, meta: localOnlyMeta };
    }

    const isBrowseMode = !analyzed.normalized;
    const browseOrSearchQuery = isBrowseMode ? '(browse)' : (analyzed.providerQuery || analyzed.normalized);

    try {
      const externalResults = isBrowseMode
        ? await this.registry.browseExternal({
            limit: Math.min(resolved.pageSize * 8, 96),
            offset: 0,
          })
        : await this.registry.searchExternal(browseOrSearchQuery, {
            limit: Math.min(resolved.pageSize * 4, 48),
            offset: (resolved.page - 1) * resolved.pageSize,
          });

      const meta: SearchMeta = {
        externalProvidersQueried: externalProviders.length,
        externalProvidersAvailable: externalResults.size,
        externalResultCount: 0,
        localOnly: false,
      };

      if (externalResults.size === 0) {
        meta.localOnly = true;
        meta.categoryCounts = queryScopedCategoryCounts;
        console.log(`${TAG} "${browseOrSearchQuery}" → ${localResult.total} catalog results, 0 external providers responded`);
        this.recordSearchAnalytics(analyzed, localResult.total, startMs, resolved);
        return { ...localResult, meta };
      }

      // ─── Stage 1: Discover — collect raw candidates ──────────
      const localIds = new Set(localQueryScopedSummaries.map((m) => m.id));
      const allCandidates: Array<{ providerId: string; result: ProviderResult }> = [];

      for (const [providerId, providerResults] of externalResults) {
        console.log(`${TAG} Stage 1 (discover): Provider "${providerId}" returned ${providerResults.length} candidates for "${browseOrSearchQuery}"`);
        for (const result of providerResults) {
          allCandidates.push({ providerId, result });
        }
      }

      // ─── Stage 2: Enrich — fetch full details for candidates with unknown license ──
      const needsEnrichment: Map<string, ProviderResult[]> = new Map();
      let alreadyAllowed = 0;
      let alreadyRestricted = 0;
      let missingLicense = 0;

      for (const { providerId, result } of allCandidates) {
        const cached = this.catalogStore.getByExternalId(result.externalId, providerId);
        if (cached && cached.license.commercialUse !== 'unknown') {
          if (isStorefrontEligible(cached, providerId)) alreadyAllowed++;
          else alreadyRestricted++;
          continue;
        }

        if (result.model.license.commercialUse === 'allowed') {
          alreadyAllowed++;
        } else if (result.model.license.commercialUse === 'restricted') {
          alreadyRestricted++;
        } else {
          missingLicense++;
          const bucket = needsEnrichment.get(providerId) ?? [];
          bucket.push(result);
          needsEnrichment.set(providerId, bucket);
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `${TAG} Stage 2 (enrich): ${allCandidates.length} candidates — ` +
          `${alreadyAllowed} allowed, ${alreadyRestricted} restricted, ${missingLicense} need enrichment`,
        );
      }

      const enrichedMap = new Map<string, ProviderResult>();
      let enrichedAllowed = 0;
      let enrichedRestricted = 0;
      let enrichedStillUnknown = 0;

      if (needsEnrichment.size > 0 && this.registry) {
        for (const [providerId, candidates] of needsEnrichment) {
          const provider = this.registry.get(providerId);
          if (provider?.enrichCandidates) {
            try {
              const results = await provider.enrichCandidates(candidates);
              for (const [extId, enriched] of results) {
                enrichedMap.set(`${providerId}:${extId}`, enriched);
                if (enriched.model.license.commercialUse === 'allowed') enrichedAllowed++;
                else if (enriched.model.license.commercialUse === 'restricted') enrichedRestricted++;
                else enrichedStillUnknown++;
              }
            } catch (err) {
              console.warn(`${TAG} Enrichment failed for ${providerId}:`, (err as Error).message);
            }
          } else {
            // Provider doesn't support enrichment — these stay unknown
            enrichedStillUnknown += candidates.length;
          }
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(
            `${TAG} Stage 2 (enrich) results: ${enrichedMap.size} enriched — ` +
            `${enrichedAllowed} allowed, ${enrichedRestricted} restricted, ${enrichedStillUnknown} still unknown`,
          );
        }
      }

      // ─── Stage 3: Filter — apply commercial-use gate after enrichment ──
      const externalEntries: CatalogEntry[] = [];
      let licenseExcluded = 0;

      for (const { providerId, result } of allCandidates) {
        // Use enriched version if available, otherwise original
        const enrichedKey = `${providerId}:${result.externalId}`;
        const finalResult = enrichedMap.get(enrichedKey) ?? result;

        const ingested = this.catalogService.ingest([finalResult]);
        const entry = ingested[0];
        if (!entry) continue;

        if (!isStorefrontEligible(entry, providerId)) {
          licenseExcluded++;
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `${TAG} Stage 3 (filter): ${storefrontEligibilityReason(entry, providerId)} — "${entry.name}" (${entry.id})`,
            );
          }
          continue;
        }
        if (!localIds.has(entry.id)) {
          localIds.add(entry.id);
          externalEntries.push(entry);
        }
      }

      console.log(
        `${TAG} Stage 3 (filter): ${externalEntries.length} eligible, ${licenseExcluded} excluded after enrichment`,
      );

      const { unique: dedupedExternal, duplicatesRemoved } = deduplicate(externalEntries);
      if (duplicatesRemoved > 0) {
        console.log(`${TAG} Removed ${duplicatesRemoved} duplicate(s) from external results`);
      }

      // Score external results using the same ranking engine so we can
      // merge them with local results in a relevance-aware order.
      const scoredExternal = ranking.rankWithScores(dedupedExternal, query);
      const externalItems = scoredExternal.map((s) => toSummary(s.item));
      meta.externalResultCount = externalItems.length;

      if (process.env.NODE_ENV === 'development') {
        const providerBreakdown: string[] = [];
        for (const [pid, pResults] of externalResults) {
          providerBreakdown.push(`${pid}:${pResults.length}`);
        }
        console.log(
          `${TAG} "${query}" [${analyzed.language}] → ` +
          `${localResult.total} catalog + ${externalItems.length} external (${providerBreakdown.join(', ')}) | ` +
          `synthetic injected: 0`,
        );
      }

      if (externalItems.length === 0) {
        meta.categoryCounts = queryScopedCategoryCounts;
        this.recordSearchAnalytics(analyzed, localResult.total, startMs, resolved);
        return { ...localResult, meta };
      }

      // Merge by interleaving: local items are already relevance-ranked by
      // CatalogStore, external items are relevance-ranked above. Combine
      // all into a single array and re-rank to get a unified relevance order.
      const allModels = [
        ...localQueryScopedSummaries.map((s) => ({ summary: s, isLocal: true })),
        ...externalItems.map((s) => ({ summary: s, isLocal: false })),
      ];

      // Build a score lookup from the scored arrays
      const scoreMap = new Map<string, number>();
      for (const s of scoredExternal) {
        scoreMap.set(s.item.id, s.finalScore);
      }
      // Local items that passed through CatalogStore.search have implicit relevance
      // (zero-relevance items are already filtered). Give them a base score from popularity.
      for (const item of localQueryScopedSummaries) {
        if (!scoreMap.has(item.id)) {
          scoreMap.set(item.id, (item.popularityScore / 100) * 0.5 + 0.5);
        }
      }

      allModels.sort((a, b) => {
        const scoreA = scoreMap.get(a.summary.id) ?? 0;
        const scoreB = scoreMap.get(b.summary.id) ?? 0;
        return scoreB - scoreA;
      });

      const queryScopedModels = allModels.map((m) => m.summary);
      meta.categoryCounts = this.computeCategoryCounts(queryScopedModels);
      const displayedModels = resolved.category
        ? queryScopedModels.filter((m) => m.category === resolved.category)
        : queryScopedModels;
      const paged = paginateSummaries(displayedModels, resolved.page, resolved.pageSize);
      this.recordSearchAnalytics(analyzed, paged.total, startMs, resolved);

      return {
        ...paged,
        meta,
      };
    } catch (err) {
      console.error(`${TAG} External search error, falling back to catalog:`, err);
      this.recordSearchAnalytics(analyzed, localResult.total, startMs, resolved);
      const fallbackMeta = {
        ...localOnlyMeta,
        externalProvidersQueried: externalProviders.length,
        categoryCounts: queryScopedCategoryCounts,
      };
      return { ...localResult, meta: fallbackMeta };
    }
  }

  // ─── Model Details ─────────────────────────────────────────

  async getModel(id: string): Promise<NormalizedModel | null> {
    return this.catalogService.getModel(id);
  }

  // ─── Popular Models ────────────────────────────────────────

  async getPopular(limit = 8): Promise<ModelSummary[]> {
    const catalogPopular = this.catalogStore.findPopular(limit);

    if (!this.registry) return catalogPopular;

    try {
      const externalProviders = this.registry.getExternal();
      if (externalProviders.length === 0) return catalogPopular;

      const perProvider = Math.max(4, Math.ceil(limit / externalProviders.length));

      const fetches = externalProviders.map(async (provider) => {
        try {
          const isUp = await Promise.race([
            provider.isAvailable(),
            new Promise<boolean>((r) => setTimeout(() => r(false), 2000)),
          ]);
          if (!isUp) return [] as NormalizedModel[];

          if ('getPopularModels' in provider && typeof (provider as Record<string, unknown>).getPopularModels === 'function') {
            const models = await (provider as { getPopularModels: (n: number) => Promise<NormalizedModel[]> }).getPopularModels(perProvider);
            this.catalogService.ingestNormalized(provider.id, models);
            return models;
          }

          const results = await provider.search('popular', { limit: perProvider });
          const models = results.map((r) => r.model);
          this.catalogService.ingestNormalized(provider.id, models);
          return models;
        } catch (err) {
          console.warn(`${TAG} Popular fetch from ${provider.id} failed:`, (err as Error).message);
          return [] as NormalizedModel[];
        }
      });

      let allExternal = (await Promise.all(fetches)).flat();

      // Enrich popular models with unknown license before filtering
      if (this.registry && allExternal.some((m) => m.license.commercialUse === 'unknown')) {
        const unknowns = allExternal.filter((m) => m.license.commercialUse === 'unknown');
        const byProvider = new Map<string, ProviderResult[]>();
        for (const m of unknowns) {
          const pid = m.source.name;
          const bucket = byProvider.get(pid) ?? [];
          bucket.push({ providerId: pid, externalId: m.externalId, model: m });
          byProvider.set(pid, bucket);
        }
        for (const [pid, candidates] of byProvider) {
          const provider = this.registry.get(pid);
          if (provider?.enrichCandidates) {
            try {
              const enriched = await provider.enrichCandidates(candidates);
              allExternal = allExternal.map((m) => {
                const e = enriched.get(m.externalId);
                return e ? e.model : m;
              });
            } catch { /* enrichment is best-effort */ }
          }
        }
      }

      allExternal = allExternal.filter((m) => {
        const pid = m.source.name;
        if (!isStorefrontEligible(m, pid)) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`${TAG} Popular: ${storefrontEligibilityReason(m, pid)} — "${m.name}"`);
          }
          return false;
        }
        return true;
      });
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `${TAG} getPopular: ${allExternal.length} real models from ${externalProviders.map((p) => p.id).join(', ')} | synthetic injected: 0`,
        );
      }

      if (allExternal.length === 0) return catalogPopular;

      const catalogIds = new Set(catalogPopular.map((m) => m.id));
      const externalSummaries = allExternal
        .filter((m) => !catalogIds.has(m.id))
        .map(toSummary);

      const merged = [...catalogPopular, ...externalSummaries];

      const allModels = merged as unknown as NormalizedModel[];
      const { unique } = deduplicate(allModels);
      const dedupedSummaries = unique.map((m) => {
        const existing = merged.find((s) => s.id === m.id);
        return existing ?? toSummary(m);
      });

      dedupedSummaries.sort((a, b) => b.popularityScore - a.popularityScore);
      return dedupedSummaries.slice(0, limit);
    } catch (err) {
      console.warn(`${TAG} External popular fetch failed, using catalog:`, (err as Error).message);
      return catalogPopular;
    }
  }

  async getByCategory(categoryId: string, pagination?: Partial<PaginationParams>): Promise<PaginatedResult<ModelSummary>> {
    return this.catalogStore.findByCategory(categoryId, {
      page: pagination?.page ?? 1,
      pageSize: pagination?.pageSize ?? 20,
    });
  }

  async getProviderStatus(): Promise<Array<{ id: string; displayName: string; available: boolean }>> {
    if (!this.registry) return [];
    const providers = this.registry.getAll();
    return Promise.all(
      providers.map(async (p) => ({
        id: p.id,
        displayName: p.displayName,
        available: await p.isAvailable().catch(() => false),
      })),
    );
  }

  getCatalogStats() {
    return this.catalogService.getStats();
  }

  getCategoryCounts(): Record<string, number> {
    return this.catalogStore.countByCategory();
  }

  getSearchAnalyticsStats() {
    return this.searchAnalytics.getStats();
  }

  // ─── Click Tracking ────────────────────────────────────────

  recordClick(query: string, modelId: string, position: number, source: string): void {
    this.searchAnalytics.recordClick({ query, modelId, position, source });
    this.catalogStore.recordView(modelId);
  }

  // ─── Internal ──────────────────────────────────────────────

  private computeCategoryCounts(items: ModelSummary[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const cat = item.category;
      if (cat) {
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
    }
    return counts;
  }

  private recordSearchAnalytics(
    analyzed: ReturnType<typeof analyzeQuery>,
    resultCount: number,
    startMs: number,
    options: ModelSearchOptions,
  ): void {
    this.searchAnalytics.recordSearch({
      query: analyzed.original,
      resultCount,
      language: analyzed.language,
      providerQuery: analyzed.providerQuery || undefined,
      category: options.category,
      page: options.page,
      durationMs: Date.now() - startMs,
    });
  }
}

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

function paginateSummaries(items: ModelSummary[], page: number, pageSize: number): PaginatedResult<ModelSummary> {
  const offset = (page - 1) * pageSize;
  return {
    items: items.slice(offset, offset + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}
