import { getFirestoreAdmin } from '@/lib/firebase/admin';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import { COUPONS_COLLECTION, docToCoupon } from '@/lib/firebase/coupons';
import type { Coupon } from '@/lib/types/coupon';

function isCouponDateValid(expirationDate: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expirationDate);
  if (!m) return false;
  const end = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999);
  return end >= new Date();
}

/** Load and validate a coupon for checkout (server-side). */
export async function findActiveCouponForCheckout(rawCode: string): Promise<Coupon | null> {
  const normalized = rawCode.trim().toUpperCase();
  if (!normalized) return null;

  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  const snap = await getFirestoreAdmin()
    .collection(COUPONS_COLLECTION)
    .where('code', '==', normalized)
    .limit(5)
    .get();

  for (const d of snap.docs) {
    const c = docToCoupon(d.id, d.data() as Record<string, unknown>);
    if (c && c.code === normalized && c.isActive && isCouponDateValid(c.expirationDate)) {
      return c;
    }
  }

  return null;
}
