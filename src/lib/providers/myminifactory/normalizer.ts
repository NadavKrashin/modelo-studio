import type { NormalizedModel, ModelImage, ModelSource, ModelLicense } from '@/lib/types';
import type { MMFObject, MMFImage, MMFLicense } from './types';
import { inferCategories } from '@/lib/search/category-mapper';

const MAX_NAME_LEN = 200;
const MAX_DESC_LEN = 2000;
const MAX_TAGS = 30;
const MAX_IMAGES = 20;

const MMF_SOURCE: ModelSource = {
  id: 'src-myminifactory',
  name: 'myminifactory',
  displayName: 'MyMiniFactory',
  baseUrl: 'https://www.myminifactory.com',
  logoUrl: 'https://www.myminifactory.com/favicon.ico',
  attributionRequired: true,
};

// ─── License mapping ────────────────────────────────────────

function mapMMFLicenses(licenses: MMFLicense[] | undefined, licenseStr: string | undefined): ModelLicense {
  const rawProviderLicense = licenseStr ?? (Array.isArray(licenses) ? JSON.stringify(licenses) : undefined);

  if (!Array.isArray(licenses) || licenses.length === 0) {
    return {
      spdxId: 'UNKNOWN',
      shortName: 'Unknown',
      fullName: 'Unknown License',
      localizedName: 'רישיון לא ידוע',
      url: '',
      commercialUse: 'unknown',
      commercialUseReason: 'MyMiniFactory model has no license metadata',
      rawProviderLicense,
      allowsModification: true,
      requiresAttribution: false,
      shareAlike: false,
    };
  }

  const map = new Map<string, boolean>();
  for (const lic of licenses) {
    if (lic.type) map.set(lic.type, lic.value ?? false);
  }

  const commercialUseFlag = map.get('commercial-use');
  const mention = map.get('mention');
  const remix = map.get('remix');
  const share = map.get('share');

  let spdxId = 'CUSTOM';
  let shortName = licenseStr ?? 'Custom License';
  let fullName = licenseStr ?? 'Custom License';
  let localizedName = 'רישיון מותאם אישית';

  if (commercialUseFlag && remix && !share) {
    spdxId = 'CC-BY-4.0';
    shortName = 'CC BY 4.0';
    fullName = 'Creative Commons Attribution 4.0';
    localizedName = 'קריאייטיב קומונס — ייחוס';
  } else if (commercialUseFlag && remix && share) {
    spdxId = 'CC-BY-SA-4.0';
    shortName = 'CC BY-SA 4.0';
    fullName = 'Creative Commons Attribution ShareAlike 4.0';
    localizedName = 'קריאייטיב קומונס — ייחוס ושיתוף זהה';
  } else if (!commercialUseFlag && remix) {
    spdxId = 'CC-BY-NC-4.0';
    shortName = 'CC BY-NC 4.0';
    fullName = 'Creative Commons Attribution NonCommercial 4.0';
    localizedName = 'קריאייטיב קומונס — ייחוס, ללא שימוש מסחרי';
  } else if (!commercialUseFlag && !remix) {
    spdxId = 'CC-BY-NC-ND-4.0';
    shortName = 'CC BY-NC-ND 4.0';
    fullName = 'Creative Commons Attribution NonCommercial NoDerivatives 4.0';
    localizedName = 'קריאייטיב קומונס — ייחוס, ללא מסחרי, ללא נגזרות';
  }

  let commercialUse: 'allowed' | 'restricted' | 'unknown';
  let commercialUseReason: string;
  if (commercialUseFlag === true) {
    commercialUse = 'allowed';
    commercialUseReason = 'MMF license explicitly grants commercial-use permission';
  } else if (commercialUseFlag === false) {
    commercialUse = 'restricted';
    commercialUseReason = 'MMF license explicitly denies commercial-use permission';
  } else {
    commercialUse = 'unknown';
    commercialUseReason = 'MMF license array does not include a commercial-use field';
  }

  return {
    spdxId,
    shortName,
    fullName,
    localizedName,
    url: spdxId.startsWith('CC') ? `https://creativecommons.org/licenses/${spdxId.replace('CC-', '').toLowerCase()}/4.0/` : '',
    commercialUse,
    commercialUseReason,
    rawProviderLicense,
    allowsModification: remix !== false,
    requiresAttribution: mention !== false,
    shareAlike: share === true,
  };
}

// ─── Popularity scoring ─────────────────────────────────────

function computePopularity(obj: MMFObject): number {
  const views = obj.views ?? 0;
  const likes = obj.likes ?? 0;
  const featured = obj.featured ? 20 : 0;

  const raw = likes * 3 + views * 0.01 + featured;
  return Math.max(10, Math.min(100, Math.round(Math.log10(Math.max(raw, 1)) * 25)));
}

function estimateBasePrice(obj: MMFObject): number {
  const popularity = computePopularity(obj);
  return Math.min(120, Math.max(15, 20 + Math.round(popularity * 0.4)));
}

// ─── Image normalization ────────────────────────────────────

function normalizeImages(images: MMFImage[] | undefined): ModelImage[] {
  if (!Array.isArray(images)) return [];

  const result: ModelImage[] = [];
  for (let i = 0; i < Math.min(images.length, MAX_IMAGES); i++) {
    const img = images[i];
    const thumbUrl = img.thumbnail?.url;
    const stdUrl = img.standard?.url;
    const origUrl = img.original?.url;

    const url = stdUrl ?? origUrl ?? thumbUrl ?? '';
    if (!url) continue;

    result.push({
      url,
      alt: `Image ${i + 1}`,
      isThumbnail: img.is_primary === true || i === 0,
      cachedUrl: undefined,
      thumbnailUrl: thumbUrl,
      mediumUrl: stdUrl ?? origUrl,
      largeUrl: origUrl ?? stdUrl,
    });
  }
  return result;
}

// ─── Main normalizer ────────────────────────────────────────

export function normalizeMMFObject(obj: MMFObject): NormalizedModel {
  const name = truncate(safeString(obj.name) || `MMF Object #${obj.id}`, MAX_NAME_LEN);

  const rawTags = Array.isArray(obj.tags) ? obj.tags : [];
  const tags = rawTags
    .slice(0, MAX_TAGS)
    .map((t) => safeString(t).toLowerCase())
    .filter(Boolean);

  const mmfCategories = Array.isArray(obj.categories) ? obj.categories : [];
  const catNames = mmfCategories.map((c) => safeString(c.name).toLowerCase()).filter(Boolean);

  const categories = inferCategories([...tags, ...catNames], name);

  const images = normalizeImages(obj.images);
  const description = truncate(stripHtml(safeString(obj.description)), MAX_DESC_LEN);
  const now = new Date().toISOString();

  return {
    id: `myminifactory-${obj.id}`,
    externalId: String(obj.id),
    name,
    localizedName: name,
    description,
    localizedDescription: description,
    images,
    source: MMF_SOURCE,
    sourceUrl: safeString(obj.url) || `https://www.myminifactory.com/object/3d-print-${obj.id}`,
    license: mapMMFLicenses(obj.licenses, obj.license),
    categories,
    tags,
    popularityScore: computePopularity(obj),
    supportsEmbossedText: false,
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    defaultDimensions: { widthMm: 100, heightMm: 100, depthMm: 100 },
    previewAvailable: false,
    cachedAssetState: images.length > 0 ? 'thumbnails_cached' : 'metadata_only',
    availability: 'available',
    estimatedBasePrice: estimateBasePrice(obj),
    printTimeMinutes: undefined,
    createdAt: safeString(obj.published_at) || now,
    updatedAt: now,
    indexedAt: now,
  };
}

// ─── Helpers ────────────────────────────────────────────────

function safeString(val: unknown): string {
  if (typeof val === 'string') return val.trim();
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/\s+/g, ' ')
    .trim();
}
