/**
 * Centralized provider configuration, sourced from environment variables.
 *
 * Every numeric value has a sensible default so the app runs even when
 * only the token is provided.  Values can be overridden per-provider via
 * env vars (see .env.example).
 */

export interface RetryConfig {
  maxRetries: number;
  /** Initial delay in ms — doubled each retry (exponential backoff). */
  baseDelayMs: number;
  /** Maximum per-retry delay cap. */
  maxDelayMs: number;
}

export interface CircuitBreakerConfig {
  /** How many consecutive failures before opening the circuit. */
  failureThreshold: number;
  /** How long (ms) the circuit stays open before attempting a probe. */
  resetTimeoutMs: number;
}

export interface ProviderConfig {
  enabled: boolean;
  apiToken: string;
  baseUrl: string;
  /** Per-request timeout in ms. */
  requestTimeoutMs: number;
  cacheTtl: {
    search: number;
    model: number;
    images: number;
  };
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  retry: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
}

// ─── Time constants ────────────────────────────────────────

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

// ─── Thingiverse ───────────────────────────────────────────

export function getThingiverseConfig(): ProviderConfig {
  const token = process.env.THINGIVERSE_API_TOKEN ?? '';
  return {
    enabled: token.length > 0 && process.env.THINGIVERSE_ENABLED !== 'false',
    apiToken: token,
    baseUrl: process.env.THINGIVERSE_API_URL ?? 'https://api.thingiverse.com',
    requestTimeoutMs: 10_000,
    cacheTtl: {
      search: FIVE_MINUTES,
      model: THIRTY_MINUTES,
      images: ONE_HOUR,
    },
    rateLimit: {
      maxRequests: 300,
      windowMs: FIVE_MINUTES,
    },
    retry: {
      maxRetries: 2,
      baseDelayMs: 500,
      maxDelayMs: 5_000,
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 60_000,
    },
  };
}

// ─── MyMiniFactory ──────────────────────────────────────────

export function getMyMiniFactoryConfig(): ProviderConfig {
  const token = process.env.MYMINIFACTORY_API_KEY ?? '';
  return {
    enabled: token.length > 0 && process.env.MYMINIFACTORY_ENABLED !== 'false',
    apiToken: token,
    baseUrl: process.env.MYMINIFACTORY_API_URL ?? 'https://www.myminifactory.com/api/v2',
    requestTimeoutMs: 12_000,
    cacheTtl: {
      search: FIVE_MINUTES,
      model: THIRTY_MINUTES,
      images: ONE_HOUR,
    },
    rateLimit: {
      maxRequests: 200,
      windowMs: FIVE_MINUTES,
    },
    retry: {
      maxRetries: 2,
      baseDelayMs: 600,
      maxDelayMs: 6_000,
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 60_000,
    },
  };
}

// ─── Future providers (stubs) ──────────────────────────────

export function getPrintablesConfig(): ProviderConfig {
  const token = process.env.PRINTABLES_API_TOKEN ?? '';
  return {
    enabled: token.length > 0 && process.env.PRINTABLES_ENABLED !== 'false',
    apiToken: token,
    baseUrl: process.env.PRINTABLES_API_URL ?? 'https://api.printables.com',
    requestTimeoutMs: 10_000,
    cacheTtl: { search: FIVE_MINUTES, model: THIRTY_MINUTES, images: ONE_HOUR },
    rateLimit: { maxRequests: 300, windowMs: FIVE_MINUTES },
    retry: { maxRetries: 2, baseDelayMs: 500, maxDelayMs: 5_000 },
    circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 60_000 },
  };
}

export function getThangsConfig(): ProviderConfig {
  const token = process.env.THANGS_API_TOKEN ?? '';
  return {
    enabled: token.length > 0 && process.env.THANGS_ENABLED !== 'false',
    apiToken: token,
    baseUrl: process.env.THANGS_API_URL ?? 'https://api.thangs.com',
    requestTimeoutMs: 10_000,
    cacheTtl: { search: FIVE_MINUTES, model: THIRTY_MINUTES, images: ONE_HOUR },
    rateLimit: { maxRequests: 300, windowMs: FIVE_MINUTES },
    retry: { maxRetries: 2, baseDelayMs: 500, maxDelayMs: 5_000 },
    circuitBreaker: { failureThreshold: 5, resetTimeoutMs: 60_000 },
  };
}

// ─── Env validation ────────────────────────────────────────

export interface ConfigWarning {
  provider: string;
  level: 'warn' | 'error';
  message: string;
}

/**
 * Validates all provider configs and returns warnings/errors
 * for startup diagnostics.
 */
export function validateProviderConfigs(): ConfigWarning[] {
  const warnings: ConfigWarning[] = [];

  const tvConfig = getThingiverseConfig();
  if (tvConfig.enabled && !tvConfig.apiToken) {
    warnings.push({
      provider: 'thingiverse',
      level: 'error',
      message: 'THINGIVERSE_ENABLED=true but THINGIVERSE_API_TOKEN is empty',
    });
  }
  if (tvConfig.enabled && tvConfig.apiToken.length < 10) {
    warnings.push({
      provider: 'thingiverse',
      level: 'warn',
      message: 'THINGIVERSE_API_TOKEN looks too short — double-check your token',
    });
  }
  if (!tvConfig.enabled) {
    warnings.push({
      provider: 'thingiverse',
      level: 'warn',
      message: 'Thingiverse provider is disabled — set THINGIVERSE_API_TOKEN to enable',
    });
  }

  const mmfConfig = getMyMiniFactoryConfig();
  if (mmfConfig.enabled && !mmfConfig.apiToken) {
    warnings.push({
      provider: 'myminifactory',
      level: 'error',
      message: 'MYMINIFACTORY_ENABLED=true but MYMINIFACTORY_API_KEY is empty',
    });
  }
  if (mmfConfig.enabled && mmfConfig.apiToken.length < 10) {
    warnings.push({
      provider: 'myminifactory',
      level: 'warn',
      message: 'MYMINIFACTORY_API_KEY looks too short — double-check your key',
    });
  }
  if (!mmfConfig.enabled) {
    warnings.push({
      provider: 'myminifactory',
      level: 'warn',
      message: 'MyMiniFactory provider is disabled — set MYMINIFACTORY_API_KEY to enable',
    });
  }

  return warnings;
}
