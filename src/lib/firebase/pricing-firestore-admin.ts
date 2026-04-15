import { getFirestoreAdmin } from '@/lib/firebase/admin';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/firestore';
import { mapCityDocument, type CitySizeKey } from '@/lib/firebase/cities';
import { mapSportProductDocument } from '@/lib/firebase/sport-products-shared';

/**
 * Resolves a city by document id or `slug` field and returns the unit price for the given size.
 */
export async function getCityUnitPriceAdmin(
  slug: string,
  size: CitySizeKey,
): Promise<number> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Firebase Admin is not configured');
  }
  const db = getFirestoreAdmin();
  const col = db.collection(FIRESTORE_COLLECTIONS.cities);
  const trimmed = slug.trim();
  if (!trimmed) throw new Error('City slug is required');

  let data: Record<string, unknown> | undefined;
  let docId = trimmed;

  const byId = await col.doc(trimmed).get();
  if (byId.exists) {
    data = byId.data() as Record<string, unknown>;
    docId = byId.id;
  } else {
    const q = await col.where('slug', '==', trimmed).limit(1).get();
    if (q.empty) {
      throw new Error(`City not found: ${trimmed}`);
    }
    const d = q.docs[0]!;
    data = d.data() as Record<string, unknown>;
    docId = d.id;
  }

  const city = mapCityDocument(docId, data);
  if (city.inStock === false) {
    throw new Error(`City is not available: ${trimmed}`);
  }

  const price =
    size === 'minicube' ? city.priceMinicube ?? city.priceCube : city.priceCube ?? city.priceMinicube;
  if (price === undefined || !Number.isFinite(price) || price < 0) {
    throw new Error(`Missing or invalid price for city ${trimmed} (${size})`);
  }
  return price;
}

/** Resolve Hebrew display name to a city doc (legacy simple-line carts). */
export async function findCityByHebrewNameAdmin(name: string): Promise<{
  slug: string;
  docId: string;
  priceMinicube?: number;
  priceCube?: number;
  inStock: boolean;
}> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Firebase Admin is not configured');
  }
  const n = name.trim();
  if (!n) throw new Error('City name is required');

  const col = getFirestoreAdmin().collection(FIRESTORE_COLLECTIONS.cities);
  const tryQueries = [col.where('name', '==', n).limit(1), col.where('nameHe', '==', n).limit(1)];

  for (const q of tryQueries) {
    const snap = await q.get();
    if (!snap.empty) {
      const d = snap.docs[0]!;
      const city = mapCityDocument(d.id, d.data() as Record<string, unknown>);
      return {
        docId: city.id,
        slug: city.slug,
        priceMinicube: city.priceMinicube,
        priceCube: city.priceCube,
        inStock: city.inStock,
      };
    }
  }

  throw new Error(`City not found for name: ${n}`);
}

export async function getSportBasePriceAdmin(slug: string): Promise<number> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Firebase Admin is not configured');
  }
  const trimmed = slug.trim();
  if (!trimmed) throw new Error('Sport product slug is required');

  const col = getFirestoreAdmin().collection(FIRESTORE_COLLECTIONS.sportProducts);
  const q = await col.where('slug', '==', trimmed).limit(1).get();
  if (q.empty) {
    throw new Error(`Sport product not found: ${trimmed}`);
  }
  const d = q.docs[0]!;
  const p = mapSportProductDocument(d.id, d.data() as Record<string, unknown>);
  if (!p.isActive) {
    throw new Error(`Sport product is not active: ${trimmed}`);
  }
  if (!Number.isFinite(p.basePrice) || p.basePrice < 0) {
    throw new Error(`Invalid base price for sport product: ${trimmed}`);
  }
  return p.basePrice;
}
