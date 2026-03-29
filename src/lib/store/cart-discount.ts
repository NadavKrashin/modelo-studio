import type { AppliedCoupon } from '@/lib/types';

/** Discount in ₪, capped by current subtotal. */
export function computeDiscountAmount(subtotal: number, coupon: AppliedCoupon | null): number {
  if (!coupon || subtotal <= 0) return 0;
  if (coupon.type === 'percent') {
    const raw = (subtotal * coupon.value) / 100;
    return Math.min(subtotal, Math.round(raw * 100) / 100);
  }
  if (coupon.type === 'fixed') {
    return Math.min(subtotal, Math.max(0, coupon.value));
  }
  return 0;
}

export function computeCartTotal(subtotal: number, coupon: AppliedCoupon | null): number {
  return Math.max(0, subtotal - computeDiscountAmount(subtotal, coupon));
}
