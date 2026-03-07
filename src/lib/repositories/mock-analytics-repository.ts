import type { AdminStats } from '@/lib/types';
import type { AnalyticsRepository } from './interfaces';
import type { OrderRepository } from './interfaces';

/**
 * In-memory analytics repository that computes stats from orders.
 * Replace with a proper analytics/BI layer for production.
 */
export class MockAnalyticsRepository implements AnalyticsRepository {
  private searchTermCounts = new Map<string, { count: number; lastSearchedAt: string }>();
  private orderRepo: OrderRepository;

  constructor(orderRepo: OrderRepository) {
    this.orderRepo = orderRepo;
    this.seedSearchTerms();
  }

  async getStats(): Promise<AdminStats> {
    const allOrders = await this.orderRepo.list({ page: 1, pageSize: 1000 });
    const orders = allOrders.items;
    const statusCounts = await this.orderRepo.countByStatus();

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingApprovals = statusCounts.pending_approval;
    const activeOrders =
      statusCounts.received +
      statusCounts.pending_approval +
      statusCounts.in_production +
      statusCounts.printed;

    const categoryCounts = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.items) {
        const cat = item.modelId.startsWith('mdl-') ? 'general' : 'other';
        categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + item.quantity);
      }
    }

    const topSearchTerms = [...this.searchTermCounts.entries()]
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([term, data]) => ({
        term,
        count: data.count,
        lastSearchedAt: data.lastSearchedAt,
      }));

    const revenueByDay = this.computeRevenueByDay(orders);

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const ordersAwaitingApproval = orders.filter((o) => o.status === 'pending_approval');

    return {
      totalOrders: orders.length,
      totalRevenue,
      pendingApprovals,
      activeOrders,
      topCategories: [
        { category: 'cat-toys', localizedCategory: 'צעצועים ומשחקים', count: 45, percentage: 28 },
        { category: 'cat-home-decor', localizedCategory: 'עיצוב הבית', count: 38, percentage: 24 },
        { category: 'cat-gadgets', localizedCategory: 'גאדג׳טים וכלים', count: 30, percentage: 19 },
        { category: 'cat-gifts', localizedCategory: 'מתנות ופריטים אישיים', count: 22, percentage: 14 },
        { category: 'cat-miniatures', localizedCategory: 'מיניאטורות ודמויות', count: 24, percentage: 15 },
      ],
      topSearchTerms,
      revenueByDay,
      recentOrders,
      ordersAwaitingApproval,
    };
  }

  async recordSearchTerm(term: string): Promise<void> {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return;

    const existing = this.searchTermCounts.get(normalized);
    this.searchTermCounts.set(normalized, {
      count: (existing?.count ?? 0) + 1,
      lastSearchedAt: new Date().toISOString(),
    });
  }

  async recordOrderEvent(_orderId: string, _event: string): Promise<void> {
    // future: write to analytics event log
  }

  private computeRevenueByDay(orders: import('@/lib/types').Order[]) {
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
      if (day) {
        day.revenue += order.total;
        day.orderCount++;
      }
    }
    return [...byDay.entries()].map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orderCount: data.orderCount,
    }));
  }

  private seedSearchTerms() {
    const seeds: [string, number][] = [
      ['דרקון', 142], ['מחזיק מפתחות', 128], ['phone stand', 95],
      ['עציץ', 87], ['lamp', 76], ['organizer', 71],
      ['דינוזאור', 65], ['dice tower', 58],
    ];
    for (const [term, count] of seeds) {
      this.searchTermCounts.set(term, {
        count,
        lastSearchedAt: new Date().toISOString(),
      });
    }
  }
}
