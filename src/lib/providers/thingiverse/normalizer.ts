import type { NormalizedModel, ModelImage, ModelSource } from '@/lib/types';
import type { ThingiverseThing, ThingiverseImage, ThingiverseImageSize } from './types';
import { mapThingiverseLicense } from '@/lib/licenses';
import { inferCategories } from '@/lib/search/category-mapper';

// ─── Constants ──────────────────────────────────────────────

const MAX_NAME_LEN = 200;
const MAX_DESC_LEN = 2000;
const MAX_TAGS = 30;
const MAX_IMAGES = 20;

const THINGIVERSE_SOURCE: ModelSource = {
  id: 'src-thingiverse',
  name: 'thingiverse',
  displayName: 'Thingiverse',
  baseUrl: 'https://www.thingiverse.com',
  logoUrl: 'https://www.thingiverse.com/favicon.ico',
  attributionRequired: true,
};

// ─── Scoring ────────────────────────────────────────────────

function computePopularity(thing: ThingiverseThing): number {
  const likes = thing.like_count ?? 0;
  const downloads = thing.download_count ?? 0;
  const makes = thing.make_count ?? 0;
  const collects = thing.collect_count ?? 0;

  const raw = likes * 2 + downloads * 0.5 + makes * 5 + collects * 3;
  return Math.max(10, Math.min(100, Math.round(Math.log10(Math.max(raw, 1)) * 20)));
}

function estimateBasePrice(thing: ThingiverseThing): number {
  const popularity = computePopularity(thing);
  return Math.min(120, Math.max(15, 20 + Math.round(popularity * 0.4)));
}

// ─── Image normalization ────────────────────────────────────

function isValidUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

interface ResolvedSizes {
  thumbnail?: string;
  medium?: string;
  large?: string;
  fallback?: string;
}

function extractSizes(sizes: ThingiverseImageSize[] | undefined): ResolvedSizes {
  const result: ResolvedSizes = {};
  if (!Array.isArray(sizes) || sizes.length === 0) return result;

  const find = (...preds: Array<(s: ThingiverseImageSize) => boolean>): string | undefined => {
    for (const pred of preds) {
      const match = sizes.find(pred);
      if (match && isValidUrl(match.url)) return match.url;
    }
    return undefined;
  };

  result.large = find(
    (s) => s.type === 'display' && s.size === 'large',
    (s) => s.type === 'preview' && s.size === 'large',
    (s) => s.type === 'display' && s.size === 'medium',
  );

  result.medium = find(
    (s) => s.type === 'preview' && s.size === 'large',
    (s) => s.type === 'preview' && s.size === 'medium',
    (s) => s.type === 'thumb' && s.size === 'large',
    (s) => s.size === 'large',
  );

  result.thumbnail = find(
    (s) => s.type === 'thumb' && s.size === 'medium',
    (s) => s.type === 'thumb' && s.size === 'small',
    (s) => s.type === 'thumb' && s.size === 'large',
  );

  const first = sizes.find((s) => isValidUrl(s.url));
  result.fallback = first?.url;

  return result;
}

export function normalizeImages(images: ThingiverseImage[]): ModelImage[] {
  if (!Array.isArray(images)) return [];

  const result: ModelImage[] = [];
  for (let idx = 0; idx < Math.min(images.length, MAX_IMAGES); idx++) {
    const img = images[idx];
    const resolved = extractSizes(img.sizes);

    const url = resolved.medium ?? resolved.large ?? resolved.fallback ?? (isValidUrl(img.url) ? img.url : '');
    if (!url) continue;

    result.push({
      url,
      alt: safeString(img.name) || `Image ${idx + 1}`,
      isThumbnail: idx === 0,
      thumbnailUrl: resolved.thumbnail,
      mediumUrl: resolved.medium ?? url,
      largeUrl: resolved.large,
    });
  }
  return result;
}

function thumbnailFromThing(thing: ThingiverseThing): ModelImage[] {
  if (thing.default_image) {
    const resolved = extractSizes(thing.default_image.sizes);
    const url = resolved.medium ?? resolved.large ?? resolved.fallback;
    if (url) {
      return [{
        url,
        alt: safeString(thing.name) || 'Model',
        isThumbnail: true,
        thumbnailUrl: resolved.thumbnail ?? (isValidUrl(thing.thumbnail) ? thing.thumbnail : undefined),
        mediumUrl: resolved.medium ?? url,
        largeUrl: resolved.large,
      }];
    }
  }
  if (isValidUrl(thing.thumbnail)) {
    return [{
      url: thing.thumbnail,
      alt: safeString(thing.name) || 'Model',
      isThumbnail: true,
      thumbnailUrl: thing.thumbnail,
    }];
  }
  return [];
}

// ─── Main normalizer ────────────────────────────────────────

/**
 * Normalizes a ThingiverseThing into our NormalizedModel shape.
 *
 * Every field access is defensive — the API may return partial objects,
 * null values, or unexpected types.  All raw strings are sanitised and
 * length-capped so the UI never has to worry about provider quirks.
 */
export function normalizeThing(
  thing: ThingiverseThing,
  fullImages?: ThingiverseImage[],
): NormalizedModel {
  const name = truncate(safeString(thing.name) || `Thing #${thing.id}`, MAX_NAME_LEN);
  const rawTags = Array.isArray(thing.tags) ? thing.tags : [];
  const tags = rawTags
    .slice(0, MAX_TAGS)
    .map((t) => safeString(t?.name).toLowerCase())
    .filter(Boolean);

  const categories = inferCategories(tags, name);

  const images =
    fullImages && fullImages.length > 0
      ? normalizeImages(fullImages)
      : thumbnailFromThing(thing);

  const description = truncate(
    stripHtml(safeString(thing.description)),
    MAX_DESC_LEN,
  );
  const now = new Date().toISOString();

  return {
    id: `thingiverse-${thing.id}`,
    externalId: String(thing.id),
    name,
    localizedName: name,
    description,
    localizedDescription: description,
    images,
    source: THINGIVERSE_SOURCE,
    sourceUrl: safeString(thing.public_url) || `https://www.thingiverse.com/thing:${thing.id}`,
    license: mapThingiverseLicense(thing.license),
    categories,
    tags,
    popularityScore: computePopularity(thing),
    supportsEmbossedText: false,
    supportedMaterials: ['PLA', 'PETG', 'ABS'],
    defaultDimensions: { widthMm: 100, heightMm: 100, depthMm: 100 },
    previewAvailable: false,
    cachedAssetState: fullImages && fullImages.length > 0 ? 'thumbnails_cached' : 'metadata_only',
    availability: 'available',
    estimatedBasePrice: estimateBasePrice(thing),
    printTimeMinutes: undefined,
    createdAt: safeString(thing.added) || now,
    updatedAt: safeString(thing.modified) || now,
    indexedAt: now,
  };
}

// ─── Helpers ────────────────────────────────────────────────

/** Safely coerce anything to a trimmed string. */
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
