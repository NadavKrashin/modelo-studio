import type { CartItem } from './cart';

export type OrderStatus =
  | 'received'       // התקבלה
  | 'pending_approval' // ממתינה לאישור
  | 'in_production'  // בייצור
  | 'printed'        // הודפסה
  | 'shipped'        // נשלחה
  | 'completed';     // הושלמה

export type DeliveryMethod = 'shipping' | 'pickup';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'התקבלה',
  pending_approval: 'ממתינה לאישור',
  in_production: 'בייצור',
  printed: 'הודפסה',
  shipped: 'נשלחה',
  completed: 'הושלמה',
};

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  shipping: 'משלוח',
  pickup: 'איסוף עצמי',
};

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  zipCode?: string;
  deliveryNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  customer: CustomerDetails;
  deliveryMethod: DeliveryMethod;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  total: number;
  /** Optional coupon snapshot when discount was applied at checkout. */
  couponCode?: string;
  discountAmount?: number;
  customerNotes?: string;
  adminNotes?: string;
  requiresApproval: boolean;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: OrderStatusEntry[];
}

export interface OrderStatusEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface OrderConfirmation {
  orderId: string;
  orderNumber: string;
  estimatedDate?: string;
  status: OrderStatus;
}
