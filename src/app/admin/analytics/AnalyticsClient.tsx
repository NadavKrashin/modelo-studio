'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { getFirebaseClientFirestore } from '@/lib/firebase/client';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/firestore';
import { mapOrderDoc } from '@/lib/firebase/map-order-doc';
import type { AdminStats } from '@/lib/types/admin';
import type { Order, OrderStatus } from '@/lib/types/order';
import { ORDER_STATUS_LABELS } from '@/lib/types/order';

function formatPrice(n: number) { return `₪${n.toLocaleString('he-IL')}`; }

function computeStats(orders: Order[]): AdminStats {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const pendingApprovals = orders.filter((o) => o.status === 'pending_approval').length;
  const activeOrders = orders.filter((o) => o.status !== 'completed').length;
  const ordersAwaitingApproval = orders.filter((o) => o.status === 'pending_approval');

  const now = new Date();
  const revenueByDay: AdminStats['revenueByDay'] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayOrders = orders.filter((o) => o.createdAt?.slice(0, 10) === dateStr);
    revenueByDay.push({
      date: dateStr,
      revenue: dayOrders.reduce((s, o) => s + (o.total ?? 0), 0),
      orderCount: dayOrders.length,
    });
  }

  return {
    totalOrders,
    totalRevenue,
    pendingApprovals,
    activeOrders,
    topCategories: [],
    topSearchTerms: [],
    revenueByDay,
    recentOrders: orders.slice(0, 5),
    ordersAwaitingApproval,
  };
}

export function AnalyticsClient() {
  const db = useMemo(() => getFirebaseClientFirestore(), []);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allOrders, setAllOrders] = useState<{ items: Order[]; total: number }>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, FIRESTORE_COLLECTIONS.orders));
      const orders: Order[] = [];
      snap.forEach((d) => {
        orders.push(mapOrderDoc(d.id, d.data() as Record<string, unknown>));
      });
      orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      setStats(computeStats(orders));
      setAllOrders({ items: orders, total: orders.length });
    } catch (e) {
      console.error('[AnalyticsClient] Firestore load error:', e);
      setError(`שגיאה בטעינת נתונים: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (loading) return <AnalyticsSkeleton />;
  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-500">{error ?? 'שגיאה בטעינה'}</p>
      </div>
    );
  }

  // Defensive defaults in case the API returns partial objects.
  const revenueByDay = stats.revenueByDay ?? [];
  const totalOrders = stats.totalOrders ?? 0;
  const totalRevenue = stats.totalRevenue ?? 0;
  const activeOrders = stats.activeOrders ?? 0;

  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const maxDayRevenue = Math.max(...revenueByDay.map((d) => d.revenue), 1);

  const statusBreakdown: { status: OrderStatus; count: number; color: string }[] = [
    { status: 'received', count: allOrders.items.filter((o) => o.status === 'received').length, color: 'bg-gray-400' },
    { status: 'pending_approval', count: allOrders.items.filter((o) => o.status === 'pending_approval').length, color: 'bg-warning' },
    { status: 'in_production', count: allOrders.items.filter((o) => o.status === 'in_production').length, color: 'bg-primary' },
    { status: 'printed', count: allOrders.items.filter((o) => o.status === 'printed').length, color: 'bg-secondary' },
    { status: 'shipped', count: allOrders.items.filter((o) => o.status === 'shipped').length, color: 'bg-accent' },
    { status: 'completed', count: allOrders.items.filter((o) => o.status === 'completed').length, color: 'bg-success' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">ניתוח נתונים</h1>
        <p className="text-xs text-muted">
          נתונים מעודכנים ל-{new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
          <p className="text-xs font-medium text-muted mb-1">סה&quot;כ הכנסות</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-primary">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
          <p className="text-xs font-medium text-muted mb-1">סה&quot;כ הזמנות</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
          <p className="text-xs font-medium text-muted mb-1">ממוצע להזמנה</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{formatPrice(avgOrderValue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
          <p className="text-xs font-medium text-muted mb-1">הזמנות פעילות</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{activeOrders}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-foreground text-sm">הכנסות — 7 ימים אחרונים</h2>
          <span className="text-xs text-muted">
            סה&quot;כ: {formatPrice(revenueByDay.reduce((s, d) => s + d.revenue, 0))}
          </span>
        </div>
        <div className="flex items-end gap-2.5 h-44">
          {revenueByDay.map((day) => {
            const pct = day.revenue > 0 ? Math.max(8, (day.revenue / maxDayRevenue) * 100) : 4;
            const isToday = day.date === new Date().toISOString().slice(0, 10);
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {day.revenue > 0 && <p className="text-xs font-bold text-foreground">{formatPrice(day.revenue)}</p>}
                  {day.orderCount > 0 && <p className="text-[10px] text-muted">{day.orderCount} הזמנות</p>}
                </div>
                <div
                  className={`w-full rounded-t-lg transition-all group-hover:opacity-80 ${
                    isToday ? 'bg-primary' : day.revenue > 0 ? 'bg-primary/70' : 'bg-muted-bg'
                  }`}
                  style={{ height: `${pct}%` }}
                />
                <span className={`text-[10px] ${isToday ? 'font-bold text-primary' : 'text-muted'}`}>
                  {new Date(day.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground text-sm mb-4">פילוח הזמנות לפי סטטוס</h2>

          <div className="flex rounded-full h-4 overflow-hidden mb-4">
            {statusBreakdown.filter((s) => s.count > 0).map((s) => (
              <div
                key={s.status}
                className={`${s.color} transition-all`}
                style={{ width: `${(s.count / Math.max(allOrders.total, 1)) * 100}%` }}
                title={`${ORDER_STATUS_LABELS[s.status]}: ${s.count}`}
              />
            ))}
          </div>

          <div className="space-y-2.5">
            {statusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${s.color}`} />
                  <span className="text-sm text-foreground">{ORDER_STATUS_LABELS[s.status]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">{s.count}</span>
                  <span className="text-xs text-muted w-10 text-end">
                    {allOrders.total > 0 ? Math.round((s.count / allOrders.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/admin/orders"
            className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 border border-border rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:border-gray-400 transition-all"
          >
            צפה בכל ההזמנות
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 19.5-7.5-7.5 7.5-7.5" />
            </svg>
          </Link>
        </div>

        {/* Revenue per Day Table */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground text-sm mb-4">הכנסות יומיות</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted-bg/60 text-muted text-xs">
                  <th className="text-right px-4 py-2.5 font-semibold">תאריך</th>
                  <th className="text-right px-4 py-2.5 font-semibold">הזמנות</th>
                  <th className="text-right px-4 py-2.5 font-semibold">הכנסה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.revenueByDay.map((day) => (
                  <tr key={day.date} className="hover:bg-muted-bg/30 transition-colors">
                    <td className="px-4 py-2.5 text-foreground">
                      {new Date(day.date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-semibold ${day.orderCount > 0 ? 'text-foreground' : 'text-muted'}`}>
                        {day.orderCount}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-bold ${day.revenue > 0 ? 'text-primary' : 'text-muted'}`}>
                        {day.revenue > 0 ? formatPrice(day.revenue) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="h-8 w-40 skeleton rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 skeleton rounded-2xl" />
        ))}
      </div>
      <div className="h-56 skeleton rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-72 skeleton rounded-2xl" />
        <div className="h-72 skeleton rounded-2xl" />
      </div>
    </div>
  );
}
