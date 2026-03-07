'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ModelSummary } from '@/lib/types';
import type { SearchMeta } from '@/lib/repositories';
import { CATEGORIES } from '@/lib/constants';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { SearchResultCard } from '@/components/ui/SearchResultCard';
import { ModelGridSkeleton } from '@/components/ui/Skeletons';

interface SearchApiResponse {
  items: ModelSummary[];
  total: number;
  page: number;
  pageSize: number;
  meta?: SearchMeta;
  _debug?: {
    rawQuery: string;
    normalizedQuery: string;
    categorySlug: string | null;
    categoryId: string | null;
    searchMode: string;
    cacheKey: string;
    resultCount: number;
    totalCount: number;
    mockItemCount: number;
    realItemCount: number;
    dataSource: string;
    categoryCounts?: Record<string, number>;
    staleIgnored?: boolean;
    timestamp: string;
  };
}

type FetchState = 'idle' | 'loading' | 'success' | 'error';

const HUES = [220, 260, 340, 170, 30, 200, 290, 150, 50, 310, 120, 190];

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? undefined;
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const [result, setResult] = useState<SearchApiResponse | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<SearchApiResponse['_debug'] | null>(null);
  const [dataSource, setDataSource] = useState<'network' | 'cache' | 'unknown'>('unknown');
  const [fetchDurationMs, setFetchDurationMs] = useState(0);
  const [staleIgnored, setStaleIgnored] = useState(false);

  const activeRequestId = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(async (q: string, cat: string | undefined, pg: number) => {
    const requestId = ++activeRequestId.current;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setFetchState('loading');
    setError(null);
    setResult(null);
    setDebug(null);
    setDataSource('unknown');
    setStaleIgnored(false);

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (cat) params.set('category', cat);
    params.set('page', String(pg));
    params.set('pageSize', '12');

    const url = `/api/search?${params}`;
    const startMs = performance.now();

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
      });

      if (requestId !== activeRequestId.current) {
        setStaleIgnored(true);
        if (process.env.NODE_ENV === 'development') {
          console.log('[SearchPageClient] Stale response ignored, requestId=', requestId, 'active=', activeRequestId.current);
        }
        return;
      }

      const elapsed = Math.round(performance.now() - startMs);
      setFetchDurationMs(elapsed);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: SearchApiResponse = await res.json();

      if (requestId !== activeRequestId.current) {
        setStaleIgnored(true);
        return;
      }

      setResult(data);
      setFetchState('success');
      setDataSource(data.meta?.localOnly ? 'cache' : 'network');

      if (data._debug) setDebug(data._debug);

      if (process.env.NODE_ENV === 'development') {
        const cacheKey = data._debug?.cacheKey ?? '?';
        console.log(
          `[SearchPageClient] query="${q}" category="${cat ?? ''}" cacheKey="${cacheKey}" ` +
          `results=${data.items.length} total=${data.total} categoryCounts=${JSON.stringify(data.meta?.categoryCounts ?? {})} ${elapsed}ms`,
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (requestId !== activeRequestId.current) return;

      setFetchState('error');
      setError((err as Error).message);
      console.error('[SearchPageClient] Fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    fetchResults(query, category, page);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, category, page, fetchResults]);

  const categoryCounts = result?.meta?.categoryCounts ?? {};
  const activeCategories = CATEGORIES.filter((c) => c.isActive).map((c) => ({
    ...c,
    modelCount: categoryCounts[c.id] ?? 0,
  }));

  return (
    <div className="animate-fade-in">
      {/* Search Header */}
      <div className="bg-white border-b border-border sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form action="/search" method="GET">
            {category && <input type="hidden" name="category" value={category} />}
            <div className="flex items-center bg-muted-bg rounded-xl overflow-hidden max-w-2xl border border-transparent focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-md transition-all">
              <div className="flex items-center gap-3 flex-1 px-4">
                <svg className="w-5 h-5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="חפשו מודל תלת מימדי..."
                  className="flex-1 py-3 text-foreground placeholder-gray-400 text-sm outline-none bg-transparent"
                  dir="auto"
                  autoComplete="off"
                  key={`search-input-${query}-${category ?? ''}`}
                />
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white px-6 py-3 font-semibold text-sm transition-colors"
              >
                חיפוש
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Sidebar - Categories with dynamic counts */}
          <aside className="md:w-56 shrink-0">
            <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              <Link
                href={query ? `/search?q=${encodeURIComponent(query)}` : '/search'}
                className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  !category ? 'bg-primary text-white shadow-sm' : 'bg-white text-muted border border-border hover:border-gray-300'
                }`}
              >
                הכל {!category && result && result.total > 0 && `(${result.total})`}
              </Link>
              {activeCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.slug}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                  className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    category === cat.slug ? 'bg-primary text-white shadow-sm' : 'bg-white text-muted border border-border hover:border-gray-300'
                  }`}
                >
                  {cat.localizedName} {cat.modelCount > 0 && `(${cat.modelCount})`}
                </Link>
              ))}
            </div>

            <div className="hidden md:block">
              <h3 className="font-bold text-foreground text-sm mb-3">קטגוריות</h3>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href={query ? `/search?q=${encodeURIComponent(query)}` : '/search'}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      !category ? 'bg-primary-50 text-primary font-semibold' : 'text-muted hover:bg-muted-bg hover:text-foreground'
                    }`}
                  >
                    <span className="w-5 h-5 flex items-center justify-center text-xs">✦</span>
                    <span className="flex-1">הכל</span>
                    {!category && result && result.total > 0 && <span className="text-[11px] text-muted/60">{result.total}</span>}
                  </Link>
                </li>
                {activeCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/search?category=${cat.slug}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        category === cat.slug ? 'bg-primary-50 text-primary font-semibold' : 'text-muted hover:bg-muted-bg hover:text-foreground'
                      }`}
                    >
                      <CategoryIcon iconName={cat.iconName} className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{cat.localizedName}</span>
                      <span className="text-[11px] text-muted/60">{cat.modelCount}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {fetchState === 'loading' || fetchState === 'idle' ? (
              <>
                <div className="h-5 bg-muted-bg rounded w-32 mb-5 animate-pulse" />
                <ModelGridSkeleton count={6} />
              </>
            ) : fetchState === 'error' ? (
              <div className="text-center py-24">
                <div className="w-24 h-24 bg-red-50 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">שגיאה בחיפוש</h3>
                <p className="text-muted text-sm mb-6">{error ?? 'אירעה שגיאה בלתי צפויה'}</p>
                <button
                  onClick={() => fetchResults(query, category, page)}
                  className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
                >
                  נסו שוב
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-muted">
                    {result && result.total > 0 ? (
                      <>
                        <span className="font-semibold text-foreground">{result.total}</span> תוצאות
                        {query && (
                          <span className="text-foreground">
                            {' '}עבור <span className="font-semibold">&ldquo;{query}&rdquo;</span>
                          </span>
                        )}
                      </>
                    ) : (
                      'לא נמצאו תוצאות'
                    )}
                  </p>
                </div>

                {query && result?.meta?.localOnly && (result.meta.externalProvidersQueried ?? 0) > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-center gap-2.5 text-xs text-amber-800">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    <span>מקורות חיצוניים אינם זמינים כרגע — מוצגות תוצאות מהקטלוג המקומי בלבד.</span>
                  </div>
                )}

                {result && result.items.length === 0 ? (
                  <div className="text-center py-24 animate-fade-in">
                    <div className="w-24 h-24 bg-muted-bg rounded-3xl mx-auto mb-6 flex items-center justify-center">
                      <svg className="w-12 h-12 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">לא נמצאו מודלים</h3>
                    <p className="text-muted text-sm mb-6">נסו לשנות את החיפוש או לבחור קטגוריה אחרת</p>
                    <Link href="/search" className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline">
                      נקו את החיפוש
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {(result?.items ?? []).map((item, i) => (
                      <SearchResultCard
                        key={item.id}
                        item={item}
                        index={i}
                        hue={HUES[i % HUES.length]}
                        query={query}
                      />
                    ))}
                  </div>
                )}

                {/* Dev debug panel */}
                {process.env.NODE_ENV === 'development' && debug && (
                  <div className="mt-8 border border-dashed border-gray-300 rounded-xl bg-gray-50 text-xs font-mono p-4" dir="ltr">
                    <div className="font-bold text-gray-600 mb-2">DEV Search Debug</div>
                    <div className="space-y-1 text-[11px]">
                      <div><span className="text-gray-400 w-28 inline-block">Search Mode:</span> {debug.searchMode}</div>
                      <div><span className="text-gray-400 w-28 inline-block">Raw Query:</span> {debug.rawQuery || '(empty)'}</div>
                      <div><span className="text-gray-400 w-28 inline-block">Category:</span> {debug.categorySlug ?? '(none)'}</div>
                      <div><span className="text-gray-400 w-28 inline-block">Cache Key:</span> {debug.cacheKey}</div>
                      <div><span className="text-gray-400 w-28 inline-block">Results:</span> {debug.resultCount} / {debug.totalCount}</div>
                      <div><span className="text-gray-400 w-28 inline-block">Data Source:</span> {dataSource}</div>
                      <div><span className="text-gray-400 w-28 inline-block">Stale Ignored:</span> {staleIgnored ? 'yes' : 'no'}</div>
                      <div><span className="text-gray-400 w-28 inline-block">Category Counts:</span> {JSON.stringify(result?.meta?.categoryCounts ?? {})}</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
