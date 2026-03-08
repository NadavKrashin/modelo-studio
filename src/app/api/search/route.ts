import { NextResponse } from 'next/server';
import { getSearchService } from '@/lib/services/container';
import { parseSearchParams } from '@/lib/validation/api-helpers';
import { searchQuerySchema } from '@/lib/validation';
import { analyzeQuery } from '@/lib/search/query-analyzer';
import { categorySlugToId } from '@/lib/constants';

export async function GET(request: Request) {
  const result = parseSearchParams(request.url, searchQuerySchema);
  if (result.error) return result.error;

  const { q, category: categorySlug, page, pageSize, sortBy } = result.data;
  const categoryId = categorySlugToId(categorySlug) ?? categorySlug;

  try {
    const searchService = getSearchService();
    const analyzed = analyzeQuery(q);
    const cacheKey = `search:${q}:${categoryId ?? ''}:${page}:${pageSize}:${sortBy}`;

    const searchResult = await searchService.search(q, {
      category: categoryId,
      page,
      pageSize,
      sortBy,
    });

    const searchMode = q && categoryId ? 'query+category' : q ? 'query-only' : categoryId ? 'category-only' : 'browse-all';

    return NextResponse.json({
      ...searchResult,
      _debug: process.env.NODE_ENV === 'development'
        ? {
            rawQuery: q,
            normalizedQuery: analyzed.normalized,
            language: analyzed.language,
            providerQuery: analyzed.providerQuery,
            tokens: analyzed.tokens,
            expandedTokens: analyzed.expandedTokens,
            cacheKey,
            categorySlug: categorySlug ?? null,
            categoryId: categoryId ?? null,
            searchMode,
            resultCount: searchResult.items.length,
            totalCount: searchResult.total,
            totalQueryScopedResults: Object.values(searchResult.meta?.categoryCounts ?? {}).reduce((sum, n) => sum + n, 0),
            selectedCategory: categorySlug ?? null,
            queryScopedCategoryCounts: searchResult.meta?.categoryCounts ?? {},
            displayedResultsCount: searchResult.items.length,
            syntheticItemCount: 0,
            realItemCount: searchResult.items.length,
            dataSource: 'real-providers-only',
            categoryCounts: searchResult.meta?.categoryCounts ?? {},
            timestamp: new Date().toISOString(),
          }
        : undefined,
    });
  } catch (err) {
    console.error('[API] Search error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
