import { getFirebaseClientApp } from './client';
import type { SportProduct, SportProductCategory } from '@/lib/types/sport-product';

export const SPORT_PRODUCTS_COLLECTION = 'sport-products';

const CATEGORY_VALUES: SportProductCategory[] = [
  'medal_hanger',
  'city_route',
  'data_hex',
  'other',
];

function asCategory(v: unknown): SportProductCategory {
  if (typeof v === 'string' && (CATEGORY_VALUES as string[]).includes(v)) {
    return v as SportProductCategory;
  }
  return 'other';
}

function numOrUndef(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function mapSportProductDocument(
  docId: string,
  data: Record<string, unknown>,
): SportProduct {
  const nameHe =
    typeof data.nameHe === 'string'
      ? data.nameHe
      : typeof data.name === 'string'
        ? data.name
        : docId;
  const slug =
    typeof data.slug === 'string' && data.slug.trim() !== ''
      ? data.slug.trim()
      : docId;
  const basePrice = numOrUndef(data.basePrice) ?? 0;

  let imageUrl: string | undefined;
  if (typeof data.imageUrl === 'string' && data.imageUrl.startsWith('http')) {
    imageUrl = data.imageUrl;
  } else if (data.images && typeof data.images === 'object') {
    const img = (data.images as { thumbnail?: unknown }).thumbnail;
    if (typeof img === 'string' && img.startsWith('http')) imageUrl = img;
  }

  return {
    id: docId,
    nameHe,
    slug,
    category: asCategory(data.category),
    basePrice,
    isActive: data.isActive !== false,
    imageUrl,
  };
}

/** Default Storage layout: `sport-products/{slug}/thumbnail.jpeg` */
export function buildSportProductThumbnailUrl(slug: string): string {
  const bucket = getFirebaseClientApp().options.storageBucket;
  if (!bucket || !slug) return '';
  const objectPath = `sport-products/${slug}/thumbnail.jpeg`;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
}

export function getSportProductThumbnailUrl(p: SportProduct): string {
  if (p.imageUrl && p.imageUrl.startsWith('http')) return p.imageUrl;
  return buildSportProductThumbnailUrl(p.slug);
}

export function buildSportProductImagePayload(slug: string): { thumbnail: string } {
  const url = buildSportProductThumbnailUrl(slug);
  return { thumbnail: url };
}
