import { getFirebaseClientApp } from './client';
import type { SportProduct } from '@/lib/types/sport-product';
import {
  buildSportProductThumbnailUrlForBucket,
  mapSportProductDocument,
  SPORT_PRODUCTS_COLLECTION,
} from './sport-products-shared';

export {
  buildSportProductThumbnailUrlForBucket,
  mapSportProductDocument,
  SPORT_PRODUCTS_COLLECTION,
} from './sport-products-shared';

/** Default Storage layout: `sport-products/{slug}/thumbnail.jpeg` */
export function buildSportProductThumbnailUrl(slug: string): string {
  const bucket = getFirebaseClientApp().options.storageBucket;
  return buildSportProductThumbnailUrlForBucket(bucket, slug);
}

export function getSportProductThumbnailUrl(p: SportProduct): string {
  if (p.imageUrl && p.imageUrl.startsWith('http')) return p.imageUrl;
  return buildSportProductThumbnailUrl(p.slug);
}

export function buildSportProductImagePayload(slug: string): { thumbnail: string } {
  const url = buildSportProductThumbnailUrl(slug);
  return { thumbnail: url };
}
