import type { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/firestore';
import { getFirestoreAdmin } from '@/lib/firebase/admin';
import type { Order, OrderStatus, OrderStatusEntry } from '@/lib/types';
import type { OrderListOptions, OrderRepository, PaginatedResult } from './interfaces';

const DEFAULT_LIST_LIMIT = 1000;

export class FirestoreOrderRepository implements OrderRepository {
  private db: Firestore | null = null;

  private getDb(): Firestore {
    if (this.db) return this.db;
    this.db = getFirestoreAdmin();
    return this.db;
  }

  async create(order: Order): Promise<Order> {
    await this.getDb().collection(FIRESTORE_COLLECTIONS.orders).doc(order.id).set(order);
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    const snap = await this.getDb().collection(FIRESTORE_COLLECTIONS.orders).doc(id).get();
    return snap.exists ? (snap.data() as Order) : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const normalized = orderNumber.toUpperCase();
    const snap = await this.getDb()
      .collection(FIRESTORE_COLLECTIONS.orders)
      .where('orderNumber', '==', normalized)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0]!.data() as Order;
  }

  async findByEmail(email: string): Promise<Order[]> {
    const normalized = email.trim().toLowerCase();
    const snap = await this.getDb().collection(FIRESTORE_COLLECTIONS.orders).get();
    return snap.docs
      .map((d) => d.data() as Order)
      .filter((order) => order.customer.email.trim().toLowerCase() === normalized);
  }

  async updateStatus(id: string, status: OrderStatus, note?: string): Promise<Order | null> {
    const ref = this.getDb().collection(FIRESTORE_COLLECTIONS.orders).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;

    const order = snap.data() as Order;
    const updatedAt = new Date().toISOString();
    const entry: OrderStatusEntry = {
      status,
      timestamp: updatedAt,
      note,
    };

    const updated: Order = {
      ...order,
      status,
      updatedAt,
      approvedAt:
        status === 'in_production' && order.requiresApproval && !order.approvedAt
          ? updatedAt
          : order.approvedAt,
      statusHistory: [...order.statusHistory, entry],
    };

    await ref.set(updated);
    return updated;
  }

  async list(options?: OrderListOptions): Promise<PaginatedResult<Order>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;

    const snap = await this.getDb().collection(FIRESTORE_COLLECTIONS.orders).limit(DEFAULT_LIST_LIMIT).get();
    let orders = snap.docs.map((d) => d.data() as Order);

    if (options?.status) {
      orders = orders.filter((order) => order.status === options.status);
    }

    const sortBy = options?.sortBy ?? 'newest';
    switch (sortBy) {
      case 'newest':
        orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case 'oldest':
        orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case 'total_asc':
        orders.sort((a, b) => a.total - b.total);
        break;
      case 'total_desc':
        orders.sort((a, b) => b.total - a.total);
        break;
    }

    const offset = (page - 1) * pageSize;
    return {
      items: orders.slice(offset, offset + pageSize),
      total: orders.length,
      page,
      pageSize,
    };
  }

  async countByStatus(): Promise<Record<OrderStatus, number>> {
    const snap = await this.getDb().collection(FIRESTORE_COLLECTIONS.orders).limit(DEFAULT_LIST_LIMIT).get();
    const orders = snap.docs.map((d) => d.data() as Order);
    const counts: Record<OrderStatus, number> = {
      received: 0,
      pending_approval: 0,
      in_production: 0,
      printed: 0,
      shipped: 0,
      completed: 0,
    };
    for (const order of orders) counts[order.status] += 1;
    return counts;
  }
}
