export type CachedAssetState = 'none' | 'metadata_only' | 'thumbnails_cached' | 'preview_cached' | 'full_cached';

export type ModelAvailability = 'available' | 'unavailable' | 'discontinued' | 'pending_review';

export type LicenseCommercialUse = 'allowed' | 'restricted' | 'unknown';

/**
 * Returns true only if the model's license explicitly allows commercial use.
 * Models with 'restricted' or 'unknown' licenses are excluded from the
 * customer-facing storefront as a strict business rule.
 */
export function isCommerciallyUsable(model: { license: { commercialUse: LicenseCommercialUse } }): boolean {
  return model.license.commercialUse === 'allowed';
}

export interface ModelLicense {
  spdxId: string;
  shortName: string;
  fullName: string;
  localizedName: string;
  url: string;
  commercialUse: LicenseCommercialUse;
  allowsModification: boolean;
  requiresAttribution: boolean;
  shareAlike: boolean;
  /** Raw license string as returned by the provider (for audit/debugging). */
  rawProviderLicense?: string;
  /** Human-readable reason for the commercial-use classification. */
  commercialUseReason?: string;
}

export interface ModelDimensions {
  widthMm: number;
  heightMm: number;
  depthMm: number;
}

export interface ModelImage {
  url: string;
  alt: string;
  isThumbnail: boolean;
  cachedUrl?: string;
  /** Low-res placeholder (~100-200px) for blur-up effect. */
  thumbnailUrl?: string;
  /** Medium quality (~600px) for search result cards. */
  mediumUrl?: string;
  /** High quality (~1200px+) for detail pages and hero images. */
  largeUrl?: string;
}

export interface ModelSource {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  logoUrl?: string;
  attributionRequired: boolean;
}

export interface NormalizedModel {
  id: string;
  externalId: string;
  name: string;
  localizedName: string;
  description: string;
  localizedDescription: string;
  images: ModelImage[];
  source: ModelSource;
  sourceUrl: string;
  license: ModelLicense;
  categories: string[];
  tags: string[];
  popularityScore: number;
  supportsEmbossedText: boolean;
  supportedMaterials: string[];
  defaultDimensions: ModelDimensions;
  minDimensions?: ModelDimensions;
  maxDimensions?: ModelDimensions;
  previewAvailable: boolean;
  previewUrl?: string;
  cachedAssetState: CachedAssetState;
  availability: ModelAvailability;
  estimatedBasePrice: number;
  printTimeMinutes?: number;
  createdAt: string;
  updatedAt: string;
  indexedAt: string;
}

export interface ModelSummary {
  id: string;
  name: string;
  localizedName: string;
  thumbnailUrl: string;
  category: string;
  sourceName: string;
  popularityScore: number;
  estimatedBasePrice: number;
  availability: ModelAvailability;
  commercialUse: LicenseCommercialUse;
  /** Low-res placeholder for blur-up effect (~100-200px). */
  lowResThumbnailUrl?: string;
  /** Medium-quality image for cards (~600px). */
  mediumImageUrl?: string;
}
