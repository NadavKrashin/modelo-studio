import type { NormalizedModel } from './model';

// ─── Import status ──────────────────────────────────────────

/**
 * Tracks how much data we've cached locally for a model.
 *
 *  discovered        — we know the model exists (from a search hit), minimal metadata
 *  metadata_cached   — full metadata + images URLs stored, no binary assets
 *  thumbnails_cached — thumbnail images fetched and stored locally
 *  imported          — model is ready for the storefront, all metadata present
 *  full              — STL/3MF assets cached locally (future — not stored by default)
 */
export type ImportStatus = 'discovered' | 'metadata_cached' | 'thumbnails_cached' | 'imported' | 'full';

// ─── Catalog metadata ───────────────────────────────────────

export interface CatalogMetadata {
  /** Which provider supplied this model. 'local' for seed/mock data. */
  providerId: string;
  /** ISO timestamp — when this model was first added to the catalog. */
  importedAt: string;
  /** ISO timestamp — when metadata was last refreshed from the provider. */
  lastRefreshedAt: string;
  /** How long (ms) before this entry is considered stale and should be refreshed. */
  staleAfterMs: number;
  /** Current import depth. */
  importStatus: ImportStatus;
  /** How many times this model was viewed in the storefront. */
  viewCount: number;
}

// ─── Catalog entry ──────────────────────────────────────────

/**
 * A CatalogEntry is the internal representation of a model in the Modelo
 * catalog. It wraps a NormalizedModel (the UI-facing data) with catalog
 * metadata (import status, staleness, provider tracking).
 *
 * The storefront always receives CatalogEntry objects, which are a superset
 * of NormalizedModel — UI components can use them anywhere a NormalizedModel
 * is expected.
 */
export interface CatalogEntry extends NormalizedModel {
  catalog: CatalogMetadata;
}

// ─── Provider result ────────────────────────────────────────

/**
 * Typed result returned by ModelSourceProviders.
 *
 * This is the single boundary between provider-specific code and the
 * catalog layer. The provider normalizes its raw API response into a
 * NormalizedModel and wraps it in a ProviderResult with routing metadata.
 *
 * The catalog layer then converts ProviderResult → CatalogEntry.
 */
export interface ProviderResult {
  /** The provider that produced this result (e.g., 'thingiverse'). */
  providerId: string;
  /** Provider-specific external identifier (e.g., Thingiverse thing ID). */
  externalId: string;
  /** The normalized model data — ready for the UI. */
  model: NormalizedModel;
}

// ─── Staleness helpers ──────────────────────────────────────

export function isStale(entry: CatalogEntry): boolean {
  const refreshedAt = new Date(entry.catalog.lastRefreshedAt).getTime();
  return Date.now() - refreshedAt > entry.catalog.staleAfterMs;
}

export function isSeedData(entry: CatalogEntry): boolean {
  return entry.catalog.providerId === 'local';
}

// ─── Default TTLs ───────────────────────────────────────────

export const CATALOG_DEFAULTS = {
  /** External models go stale after 30 minutes. */
  externalStaleTtlMs: 30 * 60 * 1000,
  /** Local/seed models never go stale (effectively infinite). */
  localStaleTtlMs: Number.MAX_SAFE_INTEGER,
} as const;
