'use client';

import { useState, useEffect } from 'react';
import { ORDER_STATUS_LABELS, DELIVERY_METHOD_LABELS } from '@/lib/types/order';
import type { Order, OrderStatus } from '@/lib/types';
import { formatPrice } from '@/lib/pricing';
import { useSearchParams } from 'next/navigation';

const STATUS_ORDER: OrderStatus[] = ['received', 'pending_approval', 'in_production', 'printed', 'shipped', 'completed'];

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  received: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3" /></svg>,
  pending_approval: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
  in_production: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" /></svg>,
  printed: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>,
  shipped: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>,
  completed: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
};

export function OrderTracker() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') ?? '');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchOrder = async (num: string) => {
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(num.trim())}`);
      if (res.ok) {
        setOrder(await res.json());
      } else {
        setError('לא נמצאה הזמנה עם מספר זה. ודאו שהמספר נכון ונסו שוב.');
      }
    } catch {
      setError('שגיאה בחיפוש. נסו שוב.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const num = searchParams.get('orderNumber');
    if (num) {
      setOrderNumber(num);
      fetchOrder(num);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) fetchOrder(orderNumber);
  };

  const currentStatusIdx = order ? STATUS_ORDER.indexOf(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 animate-fade-in">
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-primary-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">מעקב הזמנה</h1>
        <p className="text-muted text-sm">הזינו את מספר ההזמנה שקיבלתם לאחר ביצוע ההזמנה</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="flex-1 relative">
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="MDL-XXXXXXX"
            className="w-full px-4 py-3.5 rounded-xl border border-border bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm transition-all"
            dir="ltr"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-all shrink-0"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
          ) : (
            'חיפוש'
          )}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 text-center text-sm mb-6 animate-fade-in">
          {error}
        </div>
      )}

      {order && (
        <div className="space-y-5 animate-slide-up">
          {/* Order Header */}
          <div className="bg-white rounded-2xl border border-border/80 p-5 md:p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[11px] text-muted font-medium mb-1">מספר הזמנה</p>
                <p className="text-xl font-extrabold text-foreground" dir="ltr">{order.orderNumber}</p>
              </div>
              <span className="text-xs font-bold bg-primary-50 text-primary px-3 py-1.5 rounded-lg">
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>

            {/* Progress Steps */}
            <div className="space-y-0">
              {STATUS_ORDER.map((status, idx) => {
                const isComplete = idx <= currentStatusIdx;
                const isCurrent = idx === currentStatusIdx;
                const isLast = idx === STATUS_ORDER.length - 1;
                const historyEntry = order.statusHistory.find((h) => h.status === status);

                return (
                  <div key={status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                          isComplete
                            ? isCurrent
                              ? 'bg-primary text-white shadow-md shadow-primary/30'
                              : 'bg-primary/80 text-white'
                            : 'bg-muted-bg text-muted'
                        }`}
                      >
                        {isComplete ? STATUS_ICONS[status] : <span className="text-xs font-medium">{idx + 1}</span>}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-8 my-1 rounded-full ${isComplete && idx < currentStatusIdx ? 'bg-primary/40' : 'bg-border'}`} />
                      )}
                    </div>
                    <div className={`pb-3 ${isLast ? '' : ''}`}>
                      <p className={`text-sm font-semibold ${isComplete ? 'text-foreground' : 'text-muted'}`}>
                        {ORDER_STATUS_LABELS[status]}
                      </p>
                      {historyEntry && (
                        <p className="text-[11px] text-muted mt-0.5">
                          {new Date(historyEntry.timestamp).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-2xl border border-border/80 p-5 md:p-6">
            <h3 className="font-bold text-foreground mb-4 text-sm">פרטי הזמנה</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-5">
              <div>
                <p className="text-[11px] text-muted font-medium mb-0.5">לקוח</p>
                <p className="font-medium text-foreground">{order.customer.fullName}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted font-medium mb-0.5">אופן קבלה</p>
                <p className="font-medium text-foreground">{DELIVERY_METHOD_LABELS[order.deliveryMethod]}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-2.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground">{item.localizedModelName}</p>
                      {item.sourceName && item.sourceName !== 'Modelo' && (
                        <span className="text-[9px] font-medium bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                          {item.sourceName}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted">כמות: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-4 pt-4 flex justify-between items-baseline">
              <span className="font-bold text-foreground">סה&quot;כ</span>
              <span className="text-xl font-extrabold text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      {!order && !error && !loading && (
        <div className="text-center mt-8">
          <p className="text-xs text-muted mb-3">
            הזינו את מספר ההזמנה שקיבלתם באישור ההזמנה (פורמט: MDL-XXXXXXX)
          </p>
          <p className="text-[11px] text-muted">
            לבדיקה, נסו אחד מאלו:
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            {['MDL-2025-001', 'MDL-2025-002', 'MDL-2025-003', 'MDL-2025-004'].map((num) => (
              <button
                key={num}
                onClick={() => { setOrderNumber(num); fetchOrder(num); }}
                className="text-xs text-primary hover:underline font-semibold bg-primary-50 px-2.5 py-1 rounded-lg"
                dir="ltr"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
