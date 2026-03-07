import type { ProviderConfig } from '@/lib/config/providers';
import type { ProviderCache } from '../cache';
import type { MMFObject, MMFSearchResponse } from './types';

export class MMFApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint?: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'MMFApiError';
  }
}

type CircuitState = 'closed' | 'open' | 'half-open';

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold: number;
  private readonly resetTimeout: number;

  constructor(threshold: number, resetTimeoutMs: number) {
    this.threshold = threshold;
    this.resetTimeout = resetTimeoutMs;
  }

  get isOpen(): boolean {
    if (this.state === 'closed') return false;
    if (this.state === 'open' && Date.now() - this.lastFailureTime > this.resetTimeout) {
      this.state = 'half-open';
      return false;
    }
    return this.state === 'open';
  }

  get currentState(): CircuitState {
    if (this.state === 'open' && Date.now() - this.lastFailureTime > this.resetTimeout) {
      this.state = 'half-open';
    }
    return this.state;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
      console.error(
        `[MMF] Circuit breaker OPEN after ${this.failures} consecutive failures ` +
        `(will retry in ${Math.round(this.resetTimeout / 1000)}s)`,
      );
    }
  }
}

const TAG = '[MMF]';
const NEGATIVE_CACHE_TTL = 30_000;

/**
 * Low-level HTTP client for the MyMiniFactory API v2.
 *
 * Auth: API key passed as `?key={token}` query parameter.
 * Base: https://www.myminifactory.com/api/v2
 */
export class MMFClient {
  private config: ProviderConfig;
  private cache: ProviderCache;
  private circuit: CircuitBreaker;

  constructor(config: ProviderConfig, cache: ProviderCache) {
    this.config = config;
    this.cache = cache;
    this.circuit = new CircuitBreaker(
      config.circuitBreaker.failureThreshold,
      config.circuitBreaker.resetTimeoutMs,
    );
  }

  get circuitState(): string {
    return this.circuit.currentState;
  }

  // ─── Public API ─────────────────────────────────────────────

  async search(query: string, page = 1, perPage = 20): Promise<MMFSearchResponse> {
    const cacheKey = `mmf:search:${query}:${page}:${perPage}`;
    const cached = this.cache.get<MMFSearchResponse>(cacheKey);
    if (cached) return cached;

    const negative = this.cache.get<null>(`neg:${cacheKey}`);
    if (negative !== undefined) return { total_count: 0, items: [] };

    const params = new URLSearchParams({
      q: query,
      page: String(page),
      per_page: String(perPage),
      sort: 'popularity',
    });

    const data = await this.request<MMFSearchResponse>(`/search?${params}`);

    if (!data || !data.items || data.items.length === 0) {
      this.cache.setNegative(`neg:${cacheKey}`, NEGATIVE_CACHE_TTL);
      return { total_count: 0, items: [] };
    }

    this.cache.set(cacheKey, data, this.config.cacheTtl.search);
    return data;
  }

  async getObject(objectId: number): Promise<MMFObject | null> {
    const cacheKey = `mmf:object:${objectId}`;
    const cached = this.cache.get<MMFObject>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.request<MMFObject>(`/objects/${objectId}`);
      if (data && data.id) {
        this.cache.set(cacheKey, data, this.config.cacheTtl.model);
      }
      return data;
    } catch (err) {
      if (err instanceof MMFApiError && err.status === 404) return null;
      throw err;
    }
  }

  async isReachable(): Promise<boolean> {
    try {
      const res = await this.request<MMFSearchResponse>('/search?q=test&per_page=1');
      return !!res;
    } catch {
      return false;
    }
  }

  // ─── HTTP Layer ─────────────────────────────────────────────

  private async request<T>(path: string, attempt = 0): Promise<T> {
    if (this.circuit.isOpen) {
      throw new MMFApiError('Circuit breaker is open', 503, path, true);
    }

    const separator = path.includes('?') ? '&' : '?';
    const url = `${this.config.baseUrl}${path}${separator}key=${this.config.apiToken}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const retryable = res.status >= 500 || res.status === 429;
        const error = new MMFApiError(
          `HTTP ${res.status} ${res.statusText}`,
          res.status,
          path,
          retryable,
        );

        if (retryable && attempt < this.config.retry.maxRetries) {
          const delay = Math.min(
            this.config.retry.baseDelayMs * Math.pow(2, attempt) + Math.random() * 200,
            this.config.retry.maxDelayMs,
          );
          console.warn(`${TAG} ${path} → ${res.status}, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1})`);
          await new Promise((r) => setTimeout(r, delay));
          return this.request<T>(path, attempt + 1);
        }

        this.circuit.recordFailure();
        throw error;
      }

      this.circuit.recordSuccess();
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof MMFApiError) throw err;

      const isTimeout = err instanceof DOMException && err.name === 'AbortError';
      if (isTimeout && attempt < this.config.retry.maxRetries) {
        const delay = this.config.retry.baseDelayMs * Math.pow(2, attempt);
        console.warn(`${TAG} ${path} → timeout, retrying in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        return this.request<T>(path, attempt + 1);
      }

      this.circuit.recordFailure();
      throw new MMFApiError(
        isTimeout ? 'Request timed out' : (err as Error).message,
        isTimeout ? 408 : 0,
        path,
        true,
      );
    }
  }
}
