'use client';

import type {
  Order,
  OrderStatus,
  DeliveryMethod,
  CustomerDetails,
  OrderStatusEntry,
} from '@/lib/types/order';
import type { CartItem } from '@/lib/types/cart';

/**
 * Safely convert a Firestore value (Timestamp | string | unknown) to an ISO
 * date string.  Works with both the Firebase Client SDK Timestamp objects and
 * plain ISO strings already stored in the document.
 */
function toISO(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (
    typeof val === 'object' &&
    val !== null &&
    'toDate' in val &&
    typeof (val as { toDate: () => Date }).toDate === 'function'
  ) {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (
    typeof val === 'object' &&
    val !== null &&
    'seconds' in val &&
    typeof (val as { seconds: number }).seconds === 'number'
  ) {
    return new Date((val as { seconds: number }).seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}

export function mapOrderDoc(
  id: string,
  data: Record<string, unknown>,
): Order {
  const raw = data as Record<string, unknown>;
  return {
    id,
    orderNumber: (raw.orderNumber as string) ?? '',
    items: (raw.items as CartItem[]) ?? [],
    customer: (raw.customer as CustomerDetails) ?? {
      fullName: '',
      email: '',
      phone: '',
    },
    deliveryMethod: (raw.deliveryMethod as DeliveryMethod) ?? 'shipping',
    status: (raw.status as OrderStatus) ?? 'received',
    subtotal: (raw.subtotal as number) ?? 0,
    shippingCost: (raw.shippingCost as number) ?? 0,
    total: (raw.total as number) ?? 0,
    customerNotes: raw.customerNotes as string | undefined,
    adminNotes: raw.adminNotes as string | undefined,
    requiresApproval: (raw.requiresApproval as boolean) ?? false,
    approvedAt: raw.approvedAt ? toISO(raw.approvedAt) : undefined,
    createdAt: toISO(raw.createdAt),
    updatedAt: toISO(raw.updatedAt),
    couponCode: raw.couponCode as string | undefined,
    discountAmount: raw.discountAmount as number | undefined,
    statusHistory: Array.isArray(raw.statusHistory)
      ? (raw.statusHistory as Record<string, unknown>[]).map(
          (e): OrderStatusEntry => ({
            status: (e.status as OrderStatus) ?? 'received',
            timestamp: toISO(e.timestamp),
            note: e.note as string | undefined,
          }),
        )
      : [],
  };
}
