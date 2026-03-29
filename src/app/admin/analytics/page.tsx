import Link from 'next/link';
import { getAnalyticsRepo, getOrderService } from '@/lib/services/container';
import { ORDER_STATUS_LABELS } from '@/lib/types/order';
import type { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatPrice(n: number) { return `₪${n.toLocaleString('he-IL')}`; }

export default async function AdminAnalyticsPage() {
  const analytics = getAnalyticsRepo();
  const orderService = getOrderService();
  const stats = await analytics.getStats();
  const allOrders = await orderService.listOrders({ page: 1, pageSize: 1000 });

  const avgOrderValue = stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;
  const maxDayRevenue = Math.max(...stats.revenueByDay.map((d) => d.revenue), 1);

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

      {/* ─── KPI Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
          <p className="text-xs font-medium text-muted mb-1">סה&quot;כ הכנסות</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-primary">{formatPrice(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
          <p className="text-xs font-medium text-muted mb-1">סה&quot;כ הזמנות</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
          <p className="text-xs font-medium text-muted mb-1">ממוצע להזמנה</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{formatPrice(avgOrderValue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
          <p className="text-xs font-medium text-muted mb-1">הזמנות פעילות</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{stats.activeOrders}</p>
        </div>
      </div>

      {/* ─── Revenue Chart ─── */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-foreground text-sm">הכנסות — 7 ימים אחרונים</h2>
          <span className="text-xs text-muted">
            סה&quot;כ: {formatPrice(stats.revenueByDay.reduce((s, d) => s + d.revenue, 0))}
          </span>
        </div>
        <div className="flex items-end gap-2.5 h-44">
          {stats.revenueByDay.map((day) => {
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
        {/* ─── Order Status Breakdown ─── */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground text-sm mb-4">פילוח הזמנות לפי סטטוס</h2>

          {/* Visual bar */}
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

        {/* TODO: Restore when Studio feature is active */}
        {false && (
          <>
            {/* ─── Top Categories (Studio catalog) ─── */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <h2 className="font-bold text-foreground text-sm mb-4">קטגוריות מובילות</h2>
              <div className="space-y-4">
                {stats.topCategories.map((cat, i) => {
                  const colors = ['from-primary to-blue-500', 'from-secondary to-purple-500', 'from-accent to-cyan-500', 'from-success to-emerald-500', 'from-warning to-amber-500'];
                  return (
                    <div key={cat.category}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted w-4">{i + 1}</span>
                          <span className="font-medium text-foreground">{cat.localizedCategory}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted">{cat.count} הזמנות</span>
                          <span className="text-xs font-bold text-foreground">{cat.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted-bg rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full bg-gradient-to-l ${colors[i % colors.length]}`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── Top Search Terms (Studio search) ─── */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <h2 className="font-bold text-foreground text-sm mb-4">מונחי חיפוש מובילים</h2>
              <div className="space-y-1">
                {stats.topSearchTerms.map((term, i) => {
                  const maxCount = stats.topSearchTerms[0]?.count ?? 1;
                  const pct = Math.round((term.count / maxCount) * 100);
                  return (
                    <div key={term.term} className="group flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted-bg/50 transition-colors">
                      <span className="text-xs font-bold text-muted w-5 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground truncate">{term.term}</span>
                          <span className="text-xs text-muted shrink-0 mr-2">{term.count} חיפושים</span>
                        </div>
                        <div className="w-full bg-muted-bg rounded-full h-1.5">
                          <div
                            className="bg-primary/50 h-1.5 rounded-full transition-all group-hover:bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ─── Revenue per Day Table ─── */}
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
