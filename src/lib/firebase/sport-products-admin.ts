import { isFirebaseAdminConfigured, getFirestoreAdmin } from '@/lib/firebase/admin';
import { mapSportProductDocument, SPORT_PRODUCTS_COLLECTION } from '@/lib/firebase/sport-products';
import type { SportProduct } from '@/lib/types/sport-product';

/**
 * Active storefront products only (`isActive === true` in Firestore).
 */
export async function listActiveSportProductsAdmin(): Promise<SportProduct[]> {
  if (!isFirebaseAdminConfigured()) return [];

  const snap = await getFirestoreAdmin()
    .collection(SPORT_PRODUCTS_COLLECTION)
    .where('isActive', '==', true)
    .get();

  return snap.docs.map((d) => mapSportProductDocument(d.id, d.data() as Record<string, unknown>));
}
