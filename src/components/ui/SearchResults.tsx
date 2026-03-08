'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import type { ModelSummary } from '@/lib/types';
import type { SearchMeta } from '@/lib/repositories';
import { SearchResultCard } from './SearchResultCard';
import { ModelGridSkeleton } from './Skeletons';

interface SearchDebugInfo {
  rawQuery: string;
  normalizedQuery: string;
  language: string;
  providerQuery: string;
  tokens: string[];
  expandedTokens: string[];
  cacheKey: string;
  categorySlug: string | null;
  categoryId: string | null;
  searchMode: string;
  resultCount: number;
  totalCount: number;
  syntheticItemCount: number;
  realItemCount: number;
  dataSource: string;
  timestamp: string;
}

interface SearchApiResponse {
  items: ModelSummary[];
  total: number;
  page: number;
  pageSize: number;
  meta?: SearchMeta;
  _debug?: SearchDebugInfo;
}

type FetchState = 'idle' | 'loading' | 'success' | 'error';

interface SearchResultsProps {
  query: string;
  category?: string;
  page: number;
}

const HUES = [220, 260, 340, 170, 30, 200, 290, 150, 50, 310, 120, 190];

export function SearchResults({ query, category, page }: SearchResultsProps) {
  const [result, setResult] = useState<SearchApiResponse | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<SearchDebugInfo | null>(null);
  const [dataSource, setDataSource] = useState<'network' | 'cache' | 'unknown'>('unknown');
  const [fetchDurationMs, setFetchDurationMs] = useState(0);

  // Track the active request to prevent out-of-order responses
  const activeRequestId = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(async (q: string, cat: string | undefined, pg: number) => {
    // Increment request ID — any response from a previous request will be discarded
    const requestId = ++activeRequestId.current;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Reset state immediately — show loading, clear old results
    setFetchState('loading');
    setError(null);
    setResult(null);
    setDebug(null);
    setDataSource('unknown');

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

      // Discard if a newer request has been issued
      if (requestId !== activeRequestId.current) return;

      const elapsed = Math.round(performance.now() - startMs);
      setFetchDurationMs(elapsed);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: SearchApiResponse = await res.json();

      // Final guard against out-of-order responses
      if (requestId !== activeRequestId.current) return;

      setResult(data);
      setFetchState('success');
      setDataSource(data.meta?.localOnly ? 'cache' : 'network');

      if (data._debug) {
        setDebug(data._debug);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[SearchResults] query="${q}" cacheKey="${data._debug?.cacheKey ?? '?'}" ` +
          `results=${data.items.length} total=${data.total} ${elapsed}ms`,
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (requestId !== activeRequestId.current) return;

      setFetchState('error');
      setError((err as Error).message);
      console.error('[SearchResults] Fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    fetchResults(query, category, page);

    return () => {
      // Cleanup: abort on unmount or when deps change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, category, page, fetchResults]);

  // ─── Loading state ─────────────────────────────────────────

  if (fetchState === 'loading' || fetchState === 'idle') {
    return (
      <div className="flex-1 min-w-0">
        <div className="h-5 bg-muted-bg rounded w-32 mb-5 animate-pulse" />
        <ModelGridSkeleton count={6} />
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────

  if (fetchState === 'error') {
    return (
      <div className="flex-1 min-w-0">
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
      </div>
    );
  }

  // ─── Results ──────────────────────────────────────────────

  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const meta = result?.meta;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-muted">
            {total > 0 ? (
              <>
                <span className="font-semibold text-foreground">{total}</span> תוצאות
              </>
            ) : (
              'לא נמצאו תוצאות'
            )}
            {query && (
              <span className="text-foreground">
                {' '}עבור <span className="font-semibold">&ldquo;{query}&rdquo;</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Provider fallback notice */}
      {query && meta?.localOnly && meta.externalProvidersQueried > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-center gap-2.5 text-xs text-amber-800">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span>מקורות חיצוניים אינם זמינים כרגע — מוצגות תוצאות אמת מה-cache בלבד.</span>
        </div>
      )}

      {items.length === 0 ? (
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
          {items.map((item, i) => (
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

      {/* Dev-only debug panel */}
      {process.env.NODE_ENV === 'development' && debug && (
        <SearchDebugPanel
          debug={debug}
          meta={meta}
          dataSource={dataSource}
          fetchState={fetchState}
          fetchDurationMs={fetchDurationMs}
        />
      )}
    </div>
  );
}

// ─── Dev Debug Panel ────────────────────────────────────────

interface SearchDebugPanelProps {
  debug: SearchDebugInfo;
  meta?: SearchMeta;
  dataSource: string;
  fetchState: string;
  fetchDurationMs: number;
}

function SearchDebugPanel({ debug, meta, dataSource, fetchState, fetchDurationMs }: SearchDebugPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-8 border border-dashed border-gray-300 rounded-xl bg-gray-50 text-xs font-mono" dir="ltr">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">DEV</span>
          Search Debug
        </span>
        <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 text-[11px]">
          <DebugRow label="Search Mode" value={debug.searchMode ?? '?'} />
          <DebugRow label="Raw Query" value={debug.rawQuery || '(empty)'} />
          <DebugRow label="Normalized" value={debug.normalizedQuery || '(empty)'} />
          <DebugRow label="Category Slug" value={debug.categorySlug ?? '(none)'} />
          <DebugRow label="Category ID" value={debug.categoryId ?? '(none)'} />
          <DebugRow label="Language" value={debug.language} />
          <DebugRow label="Provider Query" value={debug.providerQuery || '(same)'} />
          <DebugRow label="Tokens" value={debug.tokens.join(', ') || '(none)'} />
          <DebugRow label="Expanded Tokens" value={debug.expandedTokens.join(', ') || '(none)'} />
          <DebugRow label="Cache Key" value={debug.cacheKey} />
          <DebugRow label="Request Status" value={fetchState} />
          <DebugRow label="Fetch Duration" value={`${fetchDurationMs}ms`} />
          <DebugRow label="Result Count" value={`${debug.resultCount} / ${debug.totalCount} total`} />
          <DebugRow label="Real Items" value={String(debug.realItemCount ?? debug.resultCount)} />
          <DebugRow label="Synthetic Items" value={String(debug.syntheticItemCount ?? 0)} />
          <DebugRow label="Data Source" value={debug.dataSource ?? dataSource} />
          {meta && (
            <>
              <DebugRow label="External Queried" value={String(meta.externalProvidersQueried)} />
              <DebugRow label="External Available" value={String(meta.externalProvidersAvailable)} />
              <DebugRow label="External Results" value={String(meta.externalResultCount)} />
              <DebugRow label="Local Only" value={String(meta.localOnly)} />
            </>
          )}
          <DebugRow label="Timestamp" value={debug.timestamp} />
        </div>
      )}
    </div>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-400 w-32 shrink-0 text-right">{label}:</span>
      <span className="text-gray-700 break-all">{value}</span>
    </div>
  );
}
