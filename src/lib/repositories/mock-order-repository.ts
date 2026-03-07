import type { Order, OrderStatus, OrderStatusEntry } from '@/lib/types';
import type { OrderRepository, OrderListOptions, PaginatedResult } from './interfaces';
import { MOCK_ORDERS } from '@/lib/db/mock-orders';

/**
 * In-memory order repository.
 * Replace with PostgreSQL implementation for production.
 */
export class MockOrderRepository implements OrderRepository {
  private orders: Order[] = [...MOCK_ORDERS];

  async create(order: Order): Promise<Order> {
    this.orders.push(order);
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.find((o) => o.id === id) ?? null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.orders.find((o) => o.orderNumber === orderNumber) ?? null;
  }

  async findByEmail(email: string): Promise<Order[]> {
    return this.orders.filter(
      (o) => o.customer.email.toLowerCase() === email.toLowerCase()
    );
  }

  async updateStatus(id: string, status: OrderStatus, note?: string): Promise<Order | null> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();

    const entry: OrderStatusEntry = {
      status,
      timestamp: new Date().toISOString(),
      note,
    };
    order.statusHistory.push(entry);

    if (status === 'in_production' && order.requiresApproval && !order.approvedAt) {
      order.approvedAt = new Date().toISOString();
    }

    return order;
  }

  async list(options?: OrderListOptions): Promise<PaginatedResult<Order>> {
    let filtered = [...this.orders];

    if (options?.status) {
      filtered = filtered.filter((o) => o.status === options.status);
    }

    const sortBy = options?.sortBy ?? 'newest';
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'total_asc':
        filtered.sort((a, b) => a.total - b.total);
        break;
      case 'total_desc':
        filtered.sort((a, b) => b.total - a.total);
        break;
    }

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    return {
      items: filtered.slice(offset, offset + pageSize),
      total: filtered.length,
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
    for (const order of this.orders) {
      counts[order.status]++;
    }
    return counts;
  }
}
