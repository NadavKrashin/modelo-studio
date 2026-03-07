import type { AdminStats } from '@/lib/types';
import { MOCK_ORDERS } from './mock-orders';

export function getAdminStats(): AdminStats {
  const pendingApprovals = MOCK_ORDERS.filter((o) => o.status === 'pending_approval');
  const activeOrders = MOCK_ORDERS.filter((o) =>
    ['received', 'pending_approval', 'in_production', 'printed'].includes(o.status)
  );

  return {
    totalOrders: MOCK_ORDERS.length,
    totalRevenue: MOCK_ORDERS.reduce((sum, o) => sum + o.total, 0),
    pendingApprovals: pendingApprovals.length,
    activeOrders: activeOrders.length,
    topCategories: [
      { category: 'cat-toys', localizedCategory: 'צעצועים ומשחקים', count: 45, percentage: 28 },
      { category: 'cat-home-decor', localizedCategory: 'עיצוב הבית', count: 38, percentage: 24 },
      { category: 'cat-gadgets', localizedCategory: 'גאדג׳טים וכלים', count: 30, percentage: 19 },
      { category: 'cat-gifts', localizedCategory: 'מתנות ופריטים אישיים', count: 22, percentage: 14 },
      { category: 'cat-miniatures', localizedCategory: 'מיניאטורות ודמויות', count: 24, percentage: 15 },
    ],
    topSearchTerms: [
      { term: 'דרקון', count: 142, lastSearchedAt: '2025-03-07T10:00:00Z' },
      { term: 'מחזיק מפתחות', count: 128, lastSearchedAt: '2025-03-07T09:30:00Z' },
      { term: 'phone stand', count: 95, lastSearchedAt: '2025-03-07T08:45:00Z' },
      { term: 'עציץ', count: 87, lastSearchedAt: '2025-03-06T22:00:00Z' },
      { term: 'lamp', count: 76, lastSearchedAt: '2025-03-06T20:15:00Z' },
      { term: 'organizer', count: 71, lastSearchedAt: '2025-03-06T18:30:00Z' },
      { term: 'דינוזאור', count: 65, lastSearchedAt: '2025-03-06T17:00:00Z' },
      { term: 'dice tower', count: 58, lastSearchedAt: '2025-03-06T15:00:00Z' },
    ],
    revenueByDay: [
      { date: '2025-03-01', revenue: 110, orderCount: 1 },
      { date: '2025-03-02', revenue: 115, orderCount: 1 },
      { date: '2025-03-03', revenue: 0, orderCount: 0 },
      { date: '2025-03-04', revenue: 107, orderCount: 1 },
      { date: '2025-03-05', revenue: 90, orderCount: 1 },
      { date: '2025-03-06', revenue: 0, orderCount: 0 },
      { date: '2025-03-07', revenue: 0, orderCount: 0 },
    ],
    recentOrders: MOCK_ORDERS.slice(0, 5),
    ordersAwaitingApproval: pendingApprovals,
  };
}
