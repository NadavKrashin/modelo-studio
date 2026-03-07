import type { ProviderConfig } from '@/lib/config/providers';
import type { ProviderCache } from '../cache';
import type {
  ThingiverseThing,
  ThingiverseSearchResponse,
  ThingiverseImage,
} from './types';

// ─── Error types ────────────────────────────────────────────

export class ThingiverseApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint?: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'ThingiverseApiError';
  }
}

// ─── Circuit Breaker ────────────────────────────────────────

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
        `[Thingiverse] Circuit breaker OPEN after ${this.failures} consecutive failures ` +
        `(will retry in ${Math.round(this.resetTimeout / 1000)}s)`,
      );
    }
  }
}

// ─── Client ─────────────────────────────────────────────────

const TAG = '[Thingiverse]';
const NEGATIVE_CACHE_TTL = 30_000;

/**
 * Low-level HTTP client for the Thingiverse REST API.
 *
 * Responsibilities:
 *  - Auth token injection
 *  - Response caching (positive + negative)
 *  - Circuit breaker to avoid hammering a dead API
 *  - Sliding-window rate limiting
 *  - Exponential backoff with jitter
 *  - Structured error logging
 */
export class ThingiverseClient {
  private requestTimestamps: number[] = [];
  private circuit: CircuitBreaker;

  constructor(
    private config: ProviderConfig,
    private cache: ProviderCache,
  ) {
    this.circuit = new CircuitBreaker(
      config.circuitBreaker.failureThreshold,
      config.circuitBreaker.resetTimeoutMs,
    );
  }

  // ─── Public API ─────────────────────────────────────────

  async search(term: string, page = 1, perPage = 20): Promise<ThingiverseSearchResponse> {
    const cacheKey = `tv:search:${term}:${page}:${perPage}`;
    const cached = this.cache.get<ThingiverseSearchResponse>(cacheKey);
    if (cached) return cached;

    if (this.cache.isNegativelyCached(cacheKey)) {
      return { total: 0, hits: [] };
    }

    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        sort: 'relevant',
      });

      const data = await this.request<ThingiverseSearchResponse>(
        `/search/${encodeURIComponent(term)}?${params}`,
      );

      const safe: ThingiverseSearchResponse = {
        total: data?.total ?? 0,
        hits: Array.isArray(data?.hits) ? data.hits : [],
      };

      this.cache.set(cacheKey, safe, this.config.cacheTtl.search);
      return safe;
    } catch (err) {
      this.cache.setNegative(cacheKey, NEGATIVE_CACHE_TTL);
      throw err;
    }
  }

  async getThing(thingId: number): Promise<ThingiverseThing> {
    const cacheKey = `tv:thing:${thingId}`;
    const cached = this.cache.get<ThingiverseThing>(cacheKey);
    if (cached) return cached;

    const data = await this.request<ThingiverseThing>(`/things/${thingId}`);
    this.cache.set(cacheKey, data, this.config.cacheTtl.model);
    return data;
  }

  async getPopular(page = 1, perPage = 20): Promise<ThingiverseThing[]> {
    const cacheKey = `tv:popular:${page}:${perPage}`;
    const cached = this.cache.get<ThingiverseThing[]>(cacheKey);
    if (cached) return cached;

    if (this.cache.isNegativelyCached(cacheKey)) return [];

    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      const data = await this.request<ThingiverseThing[]>(`/popular?${params}`);
      const safe = Array.isArray(data) ? data : [];
      this.cache.set(cacheKey, safe, this.config.cacheTtl.search);
      return safe;
    } catch (err) {
      this.cache.setNegative(cacheKey, NEGATIVE_CACHE_TTL);
      throw err;
    }
  }

  async getThingImages(thingId: number): Promise<ThingiverseImage[]> {
    const cacheKey = `tv:images:${thingId}`;
    const cached = this.cache.get<ThingiverseImage[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.request<ThingiverseImage[]>(`/things/${thingId}/images`);
      const safe = Array.isArray(data) ? data : [];
      this.cache.set(cacheKey, safe, this.config.cacheTtl.images);
      return safe;
    } catch {
      return [];
    }
  }

  async isReachable(): Promise<boolean> {
    try {
      if (this.circuit.isOpen) return false;

      const response = await fetch(`${this.config.baseUrl}/things/763622`, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        this.circuit.recordSuccess();
        return true;
      }

      if (response.status === 401 || response.status === 403) {
        console.error(`${TAG} API token rejected (${response.status}) — check THINGIVERSE_API_TOKEN`);
      }
      return false;
    } catch {
      return false;
    }
  }

  get circuitState(): string {
    return this.circuit.currentState;
  }

  // ─── Internal ───────────────────────────────────────────

  private async request<T>(path: string): Promise<T> {
    if (this.circuit.isOpen) {
      throw new ThingiverseApiError(
        'Circuit breaker is open — Thingiverse API temporarily unavailable',
        503,
        path,
        true,
      );
    }

    await this.enforceRateLimit();

    const { maxRetries, baseDelayMs, maxDelayMs } = this.config.retry;
    const separator = path.includes('?') ? '&' : '?';
    const url = `${this.config.baseUrl}${path}${separator}access_token=${this.config.apiToken}`;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.recordRequest();

        const response = await fetch(url, {
          method: 'GET',
          headers: this.buildHeaders(),
          signal: AbortSignal.timeout(this.config.requestTimeoutMs),
        });

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') ?? '5', 10);
          console.warn(`${TAG} Rate limited (429), waiting ${retryAfter}s before retry`);
          this.circuit.recordFailure();
          await this.sleep(retryAfter * 1000);
          continue;
        }

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          const isPermanent = response.status >= 400 && response.status < 500 && response.status !== 429;

          if (isPermanent) {
            console.error(`${TAG} Permanent error ${response.status} on ${path}: ${body.slice(0, 200)}`);
            throw new ThingiverseApiError(
              `Thingiverse API ${response.status}: ${body.slice(0, 200)}`,
              response.status,
              path,
              false,
            );
          }

          console.warn(`${TAG} Server error ${response.status} on ${path} (attempt ${attempt + 1}/${maxRetries + 1})`);
          this.circuit.recordFailure();

          if (attempt === maxRetries) {
            throw new ThingiverseApiError(
              `Thingiverse API ${response.status} after ${maxRetries + 1} attempts`,
              response.status,
              path,
              true,
            );
          }

          await this.sleep(this.backoffDelay(attempt, baseDelayMs, maxDelayMs));
          continue;
        }

        this.circuit.recordSuccess();
        return (await response.json()) as T;
      } catch (err) {
        if (err instanceof ThingiverseApiError && !err.retryable) {
          throw err;
        }

        if (err instanceof DOMException && err.name === 'TimeoutError') {
          console.warn(`${TAG} Request timeout on ${path} (attempt ${attempt + 1}/${maxRetries + 1})`);
          this.circuit.recordFailure();
        } else if (!(err instanceof ThingiverseApiError)) {
          console.warn(`${TAG} Network error on ${path} (attempt ${attempt + 1}/${maxRetries + 1}):`, (err as Error).message);
          this.circuit.recordFailure();
        }

        if (attempt === maxRetries) {
          if (err instanceof ThingiverseApiError) throw err;
          throw new ThingiverseApiError(
            `Thingiverse request failed after ${maxRetries + 1} attempts: ${(err as Error).message}`,
            0,
            path,
            true,
          );
        }

        await this.sleep(this.backoffDelay(attempt, baseDelayMs, maxDelayMs));
      }
    }

    throw new ThingiverseApiError('Exhausted retries', 0, path, true);
  }

  private backoffDelay(attempt: number, baseMs: number, maxMs: number): number {
    const exponential = baseMs * Math.pow(2, attempt);
    const jitter = Math.random() * baseMs;
    return Math.min(exponential + jitter, maxMs);
  }

  private buildHeaders(): Record<string, string> {
    return {
      Accept: 'application/json',
      Authorization: `Bearer ${this.config.apiToken}`,
    };
  }

  private async enforceRateLimit(): Promise<void> {
    const { maxRequests, windowMs } = this.config.rateLimit;
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < windowMs);

    if (this.requestTimestamps.length >= maxRequests) {
      const oldest = this.requestTimestamps[0];
      const waitMs = windowMs - (now - oldest) + 50;
      console.warn(`${TAG} Rate limit reached locally, waiting ${waitMs}ms`);
      await this.sleep(waitMs);
    }
  }

  private recordRequest(): void {
    this.requestTimestamps.push(Date.now());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
