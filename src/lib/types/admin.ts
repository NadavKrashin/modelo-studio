import type { Order } from './order';

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  pendingApprovals: number;
  activeOrders: number;
  topCategories: CategoryStat[];
  topSearchTerms: SearchTermStat[];
  revenueByDay: RevenueDayStat[];
  recentOrders: Order[];
  ordersAwaitingApproval: Order[];
}

export interface CategoryStat {
  category: string;
  localizedCategory: string;
  count: number;
  percentage: number;
}

export interface SearchTermStat {
  term: string;
  count: number;
  lastSearchedAt: string;
}

export interface RevenueDayStat {
  date: string;
  revenue: number;
  orderCount: number;
}
