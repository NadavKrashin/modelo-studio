import type { AdminStats, Order } from '@/lib/types';
import type { AnalyticsRepository, OrderRepository } from './interfaces';

type SearchStat = { count: number; lastSearchedAt: string };

export class InMemoryAnalyticsRepository implements AnalyticsRepository {
  private readonly searchTerms = new Map<string, SearchStat>();

  constructor(private readonly orderRepo: OrderRepository) {}

  async getStats(): Promise<AdminStats> {
    const orderPage = await this.orderRepo.list({ page: 1, pageSize: 1000, sortBy: 'newest' });
    const orders = orderPage.items;
    const statusCounts = await this.orderRepo.countByStatus();

    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      pendingApprovals: statusCounts.pending_approval,
      activeOrders:
        statusCounts.received +
        statusCounts.pending_approval +
        statusCounts.in_production +
        statusCounts.printed,
      topCategories: [],
      topSearchTerms: [...this.searchTerms.entries()]
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([term, data]) => ({
          term,
          count: data.count,
          lastSearchedAt: data.lastSearchedAt,
        })),
      revenueByDay: this.computeRevenueByDay(orders),
      recentOrders: [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
      ordersAwaitingApproval: orders.filter((order) => order.status === 'pending_approval'),
    };
  }

  async recordSearchTerm(term: string): Promise<void> {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return;
    const existing = this.searchTerms.get(normalized);
    this.searchTerms.set(normalized, {
      count: (existing?.count ?? 0) + 1,
      lastSearchedAt: new Date().toISOString(),
    });
  }

  async recordOrderEvent(_orderId: string, _event: string): Promise<void> {}

  private computeRevenueByDay(orders: Order[]) {
    const byDay = new Map<string, { revenue: number; orderCount: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      byDay.set(d.toISOString().slice(0, 10), { revenue: 0, orderCount: 0 });
    }
    for (const order of orders) {
      const key = order.createdAt.slice(0, 10);
      const day = byDay.get(key);
      if (!day) continue;
      day.revenue += order.total;
      day.orderCount += 1;
    }
    return [...byDay.entries()].map(([date, data]) => ({ date, revenue: data.revenue, orderCount: data.orderCount }));
  }
}
