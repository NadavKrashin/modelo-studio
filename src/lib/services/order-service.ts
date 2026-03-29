import { v4 as uuid } from 'uuid';
import type { Order, OrderStatus, OrderConfirmation } from '@/lib/types';
import type { CreateOrderInput } from '@/lib/validation';
import type { OrderRepository, AnalyticsRepository } from '@/lib/repositories';
import type { PricingService } from './pricing-service';

/**
 * Generates a 7-character uppercase alphanumeric order number.
 * Format: MDL-XXXXXXX (e.g. MDL-A7K9B2F)
 */
function generateOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MDL-${code}`;
}

export class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private pricing: PricingService,
    private analytics: AnalyticsRepository,
  ) {}

  async create(input: CreateOrderInput): Promise<OrderConfirmation> {
    const lineItems = input.items.map((item) => {
      const unitPrice = this.pricing.calculateItemPrice(item);
      return {
        ...item,
        unitPrice,
        subtotal: unitPrice * item.quantity,
      };
    });

    const subtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
    const shippingCost = input.deliveryMethod === 'shipping' ? 35 : 0;
    const requestedDiscount = Math.min(
      Math.max(0, input.discountAmount ?? 0),
      subtotal,
    );
    const discountAmount =
      Math.round(requestedDiscount * 100) / 100;
    const total = Math.max(0, subtotal - discountAmount + shippingCost);

    const requiresApproval = lineItems.some(
      (li) =>
        li.kind === 'studio_model' &&
        (li.customization.embossedText || (li.customization.referenceImages?.length ?? 0) > 0)
    );

    const now = new Date().toISOString();
    const initialStatus: OrderStatus = requiresApproval ? 'pending_approval' : 'received';

    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + (requiresApproval ? 7 : 5));

    const order: Order = {
      id: uuid(),
      orderNumber: generateOrderNumber(),
      customer: input.customer,
      items: lineItems,
      subtotal,
      shippingCost,
      total,
      ...(discountAmount > 0
        ? {
            discountAmount,
            ...(input.couponCode?.trim()
              ? { couponCode: input.couponCode.trim().toUpperCase() }
              : {}),
          }
        : {}),
      deliveryMethod: input.deliveryMethod,
      status: initialStatus,
      requiresApproval,
      customerNotes: input.notes,
      statusHistory: [
        {
          status: initialStatus,
          timestamp: now,
          note: 'הזמנה נוצרה',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.orderRepo.create(order);

    await this.analytics.recordOrderEvent(created.id, 'order_created');

    return {
      orderId: created.id,
      orderNumber: created.orderNumber,
      status: created.status,
      estimatedDate: estimatedDate.toISOString().slice(0, 10),
    };
  }

  async getByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.orderRepo.findByOrderNumber(orderNumber);
  }

  async getById(id: string): Promise<Order | null> {
    return this.orderRepo.findById(id);
  }

  async lookup(identifier: string): Promise<Order | null> {
    if (identifier.startsWith('MDL-') || identifier.startsWith('mdl-')) {
      return this.orderRepo.findByOrderNumber(identifier.toUpperCase());
    }
    const byNumber = await this.orderRepo.findByOrderNumber(identifier);
    if (byNumber) return byNumber;
    return this.orderRepo.findById(identifier);
  }

  async updateStatus(id: string, status: OrderStatus, note?: string): Promise<Order | null> {
    const updated = await this.orderRepo.updateStatus(id, status, note);
    if (updated) {
      await this.analytics.recordOrderEvent(id, `status_changed:${status}`);
    }
    return updated;
  }

  async listOrders(options?: { status?: OrderStatus; page?: number; pageSize?: number }) {
    return this.orderRepo.list({
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 20,
      status: options?.status,
      sortBy: 'newest',
    });
  }
}
