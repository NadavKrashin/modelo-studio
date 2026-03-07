import Link from 'next/link';
import { getAnalyticsRepo, getOrderService } from '@/lib/services/container';
import { ORDER_STATUS_LABELS } from '@/lib/types/order';

function formatPrice(n: number) {
  return `₪${n.toLocaleString('he-IL')}`;
}

export default async function AdminDashboardPage() {
  const analytics = getAnalyticsRepo();
  const orderService = getOrderService();
  const stats = await analytics.getStats();
  const allOrders = await orderService.listOrders({ page: 1, pageSize: 5 });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">לוח בקרה</h1>
        <p className="text-xs text-muted">
          עדכון אחרון: {new Date().toLocaleString('he-IL', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
        </p>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted">סה&quot;כ הזמנות</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{stats.totalOrders}</p>
          <p className="text-[11px] text-muted mt-1">{stats.activeOrders} הזמנות פעילות</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted">הכנסות</span>
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-primary">{formatPrice(stats.totalRevenue)}</p>
          <p className="text-[11px] text-muted mt-1">ממוצע {formatPrice(stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0)} לכל הזמנה</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted">ממתינות לאישור</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stats.pendingApprovals > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
              <svg className={`w-5 h-5 ${stats.pendingApprovals > 0 ? 'text-warning' : 'text-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-extrabold ${stats.pendingApprovals > 0 ? 'text-warning' : 'text-foreground'}`}>{stats.pendingApprovals}</p>
          <p className="text-[11px] text-muted mt-1">
            {stats.pendingApprovals > 0 ? 'מחכות לאישור' : 'הכל מטופל'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted">הזמנות פעילות</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0L21.75 12l-4.179 2.25m0 0L12 17.25l-5.571-3m11.142 0L21.75 16.5 12 21.75 2.25 16.5l4.179-2.25" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{stats.activeOrders}</p>
          <p className="text-[11px] text-muted mt-1">בתהליך ייצור ומשלוח</p>
        </div>
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { href: '/admin/orders?status=pending_approval', label: 'אשר הזמנות', count: stats.pendingApprovals, color: 'amber' },
          { href: '/admin/orders', label: 'כל ההזמנות', count: stats.totalOrders, color: 'blue' },
          { href: '/admin/filaments', label: 'נהל פילמנטים', count: null, color: 'purple' },
          { href: '/admin/analytics', label: 'צפה בנתונים', count: null, color: 'green' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3 hover:shadow-md hover:border-primary/20 transition-all group"
          >
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{action.label}</span>
            {action.count !== null && action.count > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                action.color === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {action.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ─── Pending Approvals ─── */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-bold text-foreground text-sm">ממתינות לאישור</h2>
            <Link href="/admin/orders?status=pending_approval" className="text-xs text-primary font-semibold hover:underline">
              הצג הכל
            </Link>
          </div>
          {stats.ordersAwaitingApproval.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-sm text-muted">אין הזמנות ממתינות לאישור</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stats.ordersAwaitingApproval.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders?selected=${order.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted-bg/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground" dir="ltr">{order.orderNumber}</p>
                      <p className="text-[11px] text-muted">{order.customer.fullName} • {order.items.length} פריטים</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-bold text-foreground">{formatPrice(order.total)}</p>
                    <p className="text-[10px] text-muted">{new Date(order.createdAt).toLocaleDateString('he-IL')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ─── Recent Orders ─── */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-bold text-foreground text-sm">הזמנות אחרונות</h2>
            <Link href="/admin/orders" className="text-xs text-primary font-semibold hover:underline">
              הצג הכל
            </Link>
          </div>
          <div className="divide-y divide-border">
            {allOrders.items.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders?selected=${order.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-muted-bg/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    order.status === 'completed' ? 'bg-success' :
                    order.status === 'pending_approval' ? 'bg-warning' :
                    order.status === 'in_production' ? 'bg-primary' :
                    order.status === 'shipped' ? 'bg-accent' :
                    'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground" dir="ltr">{order.orderNumber}</p>
                    <p className="text-[11px] text-muted">{order.customer.fullName}</p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-sm font-bold text-foreground">{formatPrice(order.total)}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    order.status === 'completed' ? 'bg-green-50 text-green-700' :
                    order.status === 'pending_approval' ? 'bg-amber-50 text-amber-700' :
                    order.status === 'in_production' ? 'bg-blue-50 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ─── Top Categories ─── */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground text-sm mb-4">קטגוריות מובילות</h2>
          <div className="space-y-3.5">
            {stats.topCategories.map((cat, i) => {
              const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-success', 'bg-warning'];
              return (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-foreground">{cat.localizedCategory}</span>
                    <span className="text-xs text-muted">{cat.count} • {cat.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted-bg rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${colors[i % colors.length]}`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Top Search Terms ─── */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground text-sm mb-4">מונחי חיפוש מובילים</h2>
          <div className="space-y-1.5">
            {stats.topSearchTerms.slice(0, 8).map((term, i) => (
              <div key={term.term} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted-bg/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted w-5 text-center">{i + 1}</span>
                  <span className="text-sm font-medium text-foreground">{term.term}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{term.count}</span>
                  <div className="w-16 bg-muted-bg rounded-full h-1.5">
                    <div
                      className="bg-primary/60 h-1.5 rounded-full"
                      style={{ width: `${Math.min((term.count / (stats.topSearchTerms[0]?.count || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
