import type { Coupon, CouponDiscountType } from '@/lib/types/coupon';

export const COUPONS_COLLECTION = 'coupons';

function asDiscountType(v: unknown): CouponDiscountType {
  return v === 'fixed' ? 'fixed' : 'percent';
}

/** Map a Firestore document to `Coupon`. */
export function docToCoupon(id: string, data: Record<string, unknown>): Coupon | null {
  const code = typeof data.code === 'string' ? data.code.trim().toUpperCase() : '';
  if (!code) return null;

  const rawValue = data.value;
  const value =
    typeof rawValue === 'number' && Number.isFinite(rawValue)
      ? rawValue
      : typeof rawValue === 'string' && rawValue.trim() !== ''
        ? Number(rawValue)
        : NaN;
  if (!Number.isFinite(value)) return null;

  const exp = data.expirationDate;
  let expirationDate = '';
  if (typeof exp === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(exp)) {
    expirationDate = exp;
  } else if (exp && typeof exp === 'object' && 'toDate' in exp && typeof (exp as { toDate: () => Date }).toDate === 'function') {
    const d = (exp as { toDate: () => Date }).toDate();
    expirationDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (!expirationDate) return null;

  return {
    id,
    code,
    discountType: asDiscountType(data.discountType ?? data.type),
    value,
    expirationDate,
    isActive: Boolean(data.isActive),
  };
}
