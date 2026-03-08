import type { Order, OrderStatus, OrderStatusEntry } from '@/lib/types';
import type { OrderListOptions, OrderRepository, PaginatedResult } from './interfaces';

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders: Order[] = [];

  async create(order: Order): Promise<Order> {
    this.orders.push(order);
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.find((order) => order.id === id) ?? null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.orders.find((order) => order.orderNumber === orderNumber) ?? null;
  }

  async findByEmail(email: string): Promise<Order[]> {
    const normalized = email.trim().toLowerCase();
    return this.orders.filter((order) => order.customer.email.trim().toLowerCase() === normalized);
  }

  async updateStatus(id: string, status: OrderStatus, note?: string): Promise<Order | null> {
    const order = this.orders.find((item) => item.id === id);
    if (!order) return null;
    const timestamp = new Date().toISOString();
    const statusEntry: OrderStatusEntry = { status, timestamp, note };
    order.status = status;
    order.updatedAt = timestamp;
    order.statusHistory = [...order.statusHistory, statusEntry];
    if (status === 'in_production' && order.requiresApproval && !order.approvedAt) {
      order.approvedAt = timestamp;
    }
    return order;
  }

  async list(options?: OrderListOptions): Promise<PaginatedResult<Order>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    let items = [...this.orders];
    if (options?.status) {
      items = items.filter((order) => order.status === options.status);
    }
    return {
      items: items.slice(offset, offset + pageSize),
      total: items.length,
      page,
      pageSize,
    };
  }

  async countByStatus(): Promise<Record<OrderStatus, number>> {
    const counts: Record<OrderStatus, number> = {
      received: 0,
      pending_approval: 0,
      in_production: 0,
      printed: 0,
      shipped: 0,
      completed: 0,
    };
    for (const order of this.orders) counts[order.status] += 1;
    return counts;
  }
}
