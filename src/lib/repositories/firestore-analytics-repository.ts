import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/firestore';
import { getFirestoreAdmin } from '@/lib/firebase/admin';
import type { AdminStats, Order } from '@/lib/types';
import type { AnalyticsRepository, OrderRepository } from './interfaces';

type SearchTermDoc = {
  term: string;
  count: number;
  lastSearchedAt: string;
};

export class FirestoreAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly orderRepo: OrderRepository) {}

  async getStats(): Promise<AdminStats> {
    const allOrders = await this.orderRepo.list({ page: 1, pageSize: 1000, sortBy: 'newest' });
    const orders = allOrders.items;
    const statusCounts = await this.orderRepo.countByStatus();

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingApprovals = statusCounts.pending_approval;
    const activeOrders =
      statusCounts.received +
      statusCounts.pending_approval +
      statusCounts.in_production +
      statusCounts.printed;

    const topCategories = this.computeTopCategories(orders);
    const topSearchTerms = await this.getTopSearchTerms(10);
    const revenueByDay = this.computeRevenueByDay(orders);
    const recentOrders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    const ordersAwaitingApproval = orders.filter((o) => o.status === 'pending_approval');

    return {
      totalOrders: orders.length,
      totalRevenue,
      pendingApprovals,
      activeOrders,
      topCategories,
      topSearchTerms,
      revenueByDay,
      recentOrders,
      ordersAwaitingApproval,
    };
  }

  async recordSearchTerm(term: string): Promise<void> {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return;
    const db = getFirestoreAdmin();
    const ref = db.collection(FIRESTORE_COLLECTIONS.searchTerms).doc(normalized);
    const current = await ref.get();
    const now = new Date().toISOString();

    if (!current.exists) {
      await ref.set({ term: normalized, count: 1, lastSearchedAt: now } satisfies SearchTermDoc);
      return;
    }

    const existing = current.data() as SearchTermDoc;
    await ref.set({
      term: normalized,
      count: (existing.count ?? 0) + 1,
      lastSearchedAt: now,
    } satisfies SearchTermDoc);
  }

  async recordOrderEvent(orderId: string, event: string): Promise<void> {
    const db = getFirestoreAdmin();
    const ref = db.collection(FIRESTORE_COLLECTIONS.orderEvents).doc();
    await ref.set({
      orderId,
      event,
      createdAt: new Date().toISOString(),
    });
  }

  private async getTopSearchTerms(limit: number) {
    const db = getFirestoreAdmin();
    const snap = await db
      .collection(FIRESTORE_COLLECTIONS.searchTerms)
      .orderBy('count', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((doc) => {
      const data = doc.data() as SearchTermDoc;
      return {
        term: data.term,
        count: data.count,
        lastSearchedAt: data.lastSearchedAt,
      };
    });
  }

  private computeTopCategories(orders: Order[]) {
    const counts = new Map<string, number>();
    let total = 0;

    for (const order of orders) {
      for (const item of order.items) {
        const categoryId = item.modelId.split('-').slice(0, 2).join('-') || 'cat-unknown';
        counts.set(categoryId, (counts.get(categoryId) ?? 0) + item.quantity);
        total += item.quantity;
      }
    }

    return [...counts.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([category, count]) => ({
        category,
        localizedCategory: category,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
  }

  private computeRevenueByDay(orders: Order[]) {
    const byDay = new Map<string, { revenue: number; orderCount: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, { revenue: 0, orderCount: 0 });
    }
    for (const order of orders) {
      const key = order.createdAt.slice(0, 10);
      const day = byDay.get(key);
      if (!day) continue;
      day.revenue += order.total;
      day.orderCount += 1;
    }
    return [...byDay.entries()].map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orderCount: data.orderCount,
    }));
  }
}
