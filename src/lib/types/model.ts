export type CachedAssetState = 'none' | 'metadata_only' | 'thumbnails_cached' | 'preview_cached' | 'full_cached';

export type ModelAvailability = 'available' | 'unavailable' | 'discontinued' | 'pending_review';

export type LicenseCommercialUse = 'allowed' | 'restricted' | 'unknown';

/**
 * Providers whose models remain storefront-visible even when their license
 * metadata is missing or unrecognized.  Only *explicitly restricted* (NC)
 * licenses are hidden for these providers.
 *
 * Add provider IDs here to opt them in.  Providers NOT in this set still
 * use the strict rule: unknown → hidden.
 */
const UNKNOWN_LICENSE_ALLOWED_PROVIDERS = new Set<string>([
  'thingiverse',
]);

/**
 * Returns true only if the model's license explicitly allows commercial use.
 * Does NOT account for provider-specific business rules — prefer
 * `isStorefrontEligible()` for all storefront visibility decisions.
 */
export function isCommerciallyUsable(model: { license: { commercialUse: LicenseCommercialUse } }): boolean {
  return model.license.commercialUse === 'allowed';
}

/**
 * Provider-aware storefront visibility check.
 *
 * Rules:
 *  - `restricted` → always hidden (regardless of provider)
 *  - `allowed`    → always visible
 *  - `unknown`    → visible IF the provider is in UNKNOWN_LICENSE_ALLOWED_PROVIDERS,
 *                    hidden otherwise
 *
 * @param providerId  The catalog provider ID (e.g. 'thingiverse', 'myminifactory')
 */
export function isStorefrontEligible(
  model: { license: { commercialUse: LicenseCommercialUse } },
  providerId: string,
): boolean {
  if (model.license.commercialUse === 'restricted') return false;
  if (model.license.commercialUse === 'allowed') return true;
  return UNKNOWN_LICENSE_ALLOWED_PROVIDERS.has(providerId);
}

/**
 * Returns a human-readable reason for the visibility decision (for dev logs).
 */
export function storefrontEligibilityReason(
  model: { license: { commercialUse: LicenseCommercialUse; commercialUseReason?: string } },
  providerId: string,
): string {
  if (model.license.commercialUse === 'allowed') {
    return 'visible — license explicitly allows commercial use';
  }
  if (model.license.commercialUse === 'restricted') {
    return `hidden — explicitly restricted: ${model.license.commercialUseReason ?? 'non-commercial license'}`;
  }
  if (UNKNOWN_LICENSE_ALLOWED_PROVIDERS.has(providerId)) {
    return `visible — ${providerId} unknown license permitted by business rule`;
  }
  return `hidden — unknown license, provider "${providerId}" uses strict rule`;
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
