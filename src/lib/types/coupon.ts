/** Firestore `discountType` — percentage off cart vs fixed ₪ amount. */
export type CouponDiscountType = 'percent' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  value: number;
  /** ISO date string `YYYY-MM-DD` (from `<input type="date" />`). */
  expirationDate: string;
  isActive: boolean;
}
