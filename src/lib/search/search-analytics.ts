import type {
  SearchAnalyticsBackend,
  SearchAnalyticsStats,
  SearchEventInput,
  ClickEventInput,
  SearchTermAggregate,
  ZeroResultQuery,
} from './search-backend';

const TAG = '[SearchAnalytics]';
const MAX_EVENTS = 10_000;

interface StoredSearchEvent extends SearchEventInput {
  timestamp: string;
}

interface StoredClickEvent extends ClickEventInput {
  timestamp: string;
}

/**
 * In-memory search analytics store.
 *
 * Tracks search events and click-through data for admin analytics
 * and search quality improvement. Implements a ring buffer to cap
 * memory usage.
 *
 * For production, swap with a Kafka/BigQuery/PostHog pipeline
 * by implementing SearchAnalyticsBackend.
 */
export class InMemorySearchAnalytics implements SearchAnalyticsBackend {
  private searches: StoredSearchEvent[] = [];
  private clicks: StoredClickEvent[] = [];

  private termAgg = new Map<string, {
    count: number;
    totalResults: number;
    zeroResults: number;
    lastSearchedAt: string;
  }>();

  recordSearch(event: SearchEventInput): void {
    const stored: StoredSearchEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.searches.push(stored);
    if (this.searches.length > MAX_EVENTS) {
      this.searches = this.searches.slice(-MAX_EVENTS);
    }

    const key = event.query.toLowerCase().trim();
    if (!key) return;

    const agg = this.termAgg.get(key) ?? {
      count: 0,
      totalResults: 0,
      zeroResults: 0,
      lastSearchedAt: '',
    };
    agg.count++;
    agg.totalResults += event.resultCount;
    if (event.resultCount === 0) agg.zeroResults++;
    agg.lastSearchedAt = stored.timestamp;
    this.termAgg.set(key, agg);

    if (event.resultCount === 0) {
      console.log(`${TAG} Zero-result query: "${event.query}" [${event.language}] provider="${event.providerQuery ?? ''}" `);
    }
  }

  recordClick(event: ClickEventInput): void {
    this.clicks.push({
      ...event,
      timestamp: new Date().toISOString(),
    });
    if (this.clicks.length > MAX_EVENTS) {
      this.clicks = this.clicks.slice(-MAX_EVENTS);
    }
  }

  getTopSearches(limit: number): SearchTermAggregate[] {
    return [...this.termAgg.entries()]
      .map(([term, agg]) => ({
        term,
        count: agg.count,
        avgResultCount: agg.count > 0 ? Math.round(agg.totalResults / agg.count) : 0,
        lastSearchedAt: agg.lastSearchedAt,
        zeroResultRate: agg.count > 0 ? agg.zeroResults / agg.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getZeroResultQueries(limit: number): ZeroResultQuery[] {
    const zeroResult: ZeroResultQuery[] = [];

    for (const [term, agg] of this.termAgg) {
      if (agg.zeroResults > 0) {
        const recentSearch = this.searches
          .filter((s) => s.query.toLowerCase().trim() === term)
          .at(-1);

        zeroResult.push({
          term,
          count: agg.zeroResults,
          lastSearchedAt: agg.lastSearchedAt,
          language: recentSearch?.language ?? 'en',
        });
      }
    }

    return zeroResult
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getClickThroughRate(): number {
    if (this.searches.length === 0) return 0;
    const searchesWithResults = this.searches.filter((s) => s.resultCount > 0).length;
    if (searchesWithResults === 0) return 0;
    return this.clicks.length / searchesWithResults;
  }

  getStats(): SearchAnalyticsStats {
    return {
      totalSearches: this.searches.length,
      totalClicks: this.clicks.length,
      uniqueTerms: this.termAgg.size,
      clickThroughRate: Math.round(this.getClickThroughRate() * 100) / 100,
      zeroResultQueries: this.getZeroResultQueries(10).length,
    };
  }
}
