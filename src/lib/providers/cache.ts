/**
 * Generic in-memory TTL cache for provider API responses.
 * Shared across all providers to avoid redundant HTTP calls.
 *
 * Features:
 *  - Per-key TTL
 *  - Max-entry eviction (oldest first)
 *  - Negative caching (short-lived "failure" entries prevent retrying a broken endpoint)
 *  - Hit/miss counters for diagnostics
 *
 * For production, swap with Redis or a distributed cache.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  /** If true, the entry represents a cached failure (negative cache). */
  isNegative?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  negativeHits: number;
  size: number;
  evictions: number;
}

const NEGATIVE_SENTINEL = Symbol('CACHE_NEGATIVE');

export class ProviderCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries: number;

  private _hits = 0;
  private _misses = 0;
  private _negativeHits = 0;
  private _evictions = 0;

  constructor(maxEntries = 2000) {
    this.maxEntries = maxEntries;
  }

  // ─── Read ──────────────────────────────────────────────────

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this._misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this._misses++;
      return null;
    }
    if (entry.isNegative) {
      this._negativeHits++;
      return null;
    }
    this._hits++;
    return entry.data as T;
  }

  /**
   * Returns true if the key has a non-expired negative cache entry,
   * meaning a recent request failed and callers should avoid retrying.
   */
  isNegativelyCached(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return !!entry.isNegative;
  }

  // ─── Write ─────────────────────────────────────────────────

  set<T>(key: string, data: T, ttlMs: number): void {
    this.ensureCapacity();
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  /**
   * Store a short-lived negative entry to prevent immediate retries
   * for a known-failed endpoint/query.
   */
  setNegative(key: string, ttlMs: number): void {
    this.ensureCapacity();
    this.store.set(key, {
      data: NEGATIVE_SENTINEL,
      expiresAt: Date.now() + ttlMs,
      isNegative: true,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // ─── Invalidation ──────────────────────────────────────────

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  // ─── Diagnostics ───────────────────────────────────────────

  get size(): number {
    return this.store.size;
  }

  get stats(): CacheStats {
    return {
      hits: this._hits,
      misses: this._misses,
      negativeHits: this._negativeHits,
      size: this.store.size,
      evictions: this._evictions,
    };
  }

  /** Human-readable summary for logging. */
  statsSummary(): string {
    const s = this.stats;
    const total = s.hits + s.misses + s.negativeHits;
    const hitRate = total > 0 ? ((s.hits / total) * 100).toFixed(1) : '0.0';
    return `entries=${s.size} hits=${s.hits} misses=${s.misses} neg=${s.negativeHits} rate=${hitRate}% evictions=${s.evictions}`;
  }

  // ─── Internal ──────────────────────────────────────────────

  private ensureCapacity(): void {
    if (this.store.size < this.maxEntries) return;

    this.evictExpired();

    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest) {
        this.store.delete(oldest);
        this._evictions++;
      }
    }
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        this._evictions++;
      }
    }
  }
}
