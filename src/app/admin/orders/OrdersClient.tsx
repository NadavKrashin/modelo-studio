'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Order, OrderStatus } from '@/lib/types';
import type { FilamentOption } from '@/lib/types';
import { ORDER_STATUS_LABELS, DELIVERY_METHOD_LABELS } from '@/lib/types/order';

function formatPrice(n: number) { return `₪${n.toLocaleString('he-IL')}`; }

const STATUS_COLORS: Record<OrderStatus, string> = {
  received: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-amber-100 text-amber-700',
  in_production: 'bg-blue-100 text-blue-700',
  printed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  completed: 'bg-green-100 text-green-700',
};

const STATUS_FLOW: OrderStatus[] = ['received', 'pending_approval', 'in_production', 'printed', 'shipped', 'completed'];

function nextStatuses(current: OrderStatus): OrderStatus[] {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return [];
  return STATUS_FLOW.slice(idx + 1);
}

interface Props {
  initialOrders: Order[];
  filamentOptions: FilamentOption[];
}

export function OrdersClient({ initialOrders, filamentOptions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState(initialOrders);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>(
    (searchParams.get('status') as OrderStatus) || ''
  );
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('selected'));
  const [actionLoading, setActionLoading] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  const filtered = useMemo(() => {
    if (!filterStatus) return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId]
  );

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated: Order = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setStatusNote('');
    } catch {
      alert('שגיאה בעדכון הסטטוס');
    } finally {
      setActionLoading(false);
    }
  }

  function getFilamentName(id: string) {
    const f = filamentOptions.find((fo) => fo.id === id);
    return f ? f.localizedColorName : id;
  }

  function getFilamentColor(id: string) {
    return filamentOptions.find((fo) => fo.id === id)?.colorHex ?? '#999';
  }

  function selectOrder(id: string | null) {
    setSelectedId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('selected', id);
    else url.searchParams.delete('selected');
    router.replace(url.pathname + url.search, { scroll: false });
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-extrabold text-foreground">ניהול הזמנות</h1>
        <span className="text-xs text-muted">{filtered.length} הזמנות</span>
      </div>

      {/* ─── Status Filters ─── */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterStatus('')}
          className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterStatus === '' ? 'bg-foreground text-white' : 'bg-white border border-border text-muted hover:border-gray-300'
          }`}
        >
          הכל ({orders.length})
        </button>
        {STATUS_FLOW.map((s) => {
          const count = orders.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === s ? 'bg-foreground text-white' : 'bg-white border border-border text-muted hover:border-gray-300'
              }`}
            >
              {ORDER_STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex gap-5">
        {/* ─── Orders Table ─── */}
        <div className={`flex-1 min-w-0 ${selected ? 'hidden lg:block' : ''}`}>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted-bg/60 text-muted text-xs">
                    <th className="text-right px-4 py-3 font-semibold">הזמנה</th>
                    <th className="text-right px-4 py-3 font-semibold">לקוח</th>
                    <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">פריטים</th>
                    <th className="text-right px-4 py-3 font-semibold">סכום</th>
                    <th className="text-right px-4 py-3 font-semibold hidden md:table-cell">קבלה</th>
                    <th className="text-right px-4 py-3 font-semibold">סטטוס</th>
                    <th className="text-right px-4 py-3 font-semibold hidden lg:table-cell">תאריך</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => selectOrder(order.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedId === order.id ? 'bg-primary-50' : 'hover:bg-muted-bg/40'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold text-foreground text-xs" dir="ltr">{order.orderNumber}</span>
                        {order.requiresApproval && (
                          <span className="me-1.5 inline-block w-1.5 h-1.5 rounded-full bg-warning" title="דורש אישור" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground text-xs">{order.customer.fullName}</p>
                        <p className="text-[10px] text-muted" dir="ltr">{order.customer.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted">{order.items.length}</td>
                      <td className="px-4 py-3 font-bold text-foreground">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted text-xs">{DELIVERY_METHOD_LABELS[order.deliveryMethod]}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[11px] font-semibold ${STATUS_COLORS[order.status]}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted text-xs">
                        {new Date(order.createdAt).toLocaleDateString('he-IL')}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted text-sm">
                        אין הזמנות בסטטוס זה
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── Detail Panel ─── */}
        {selected && (
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="bg-white rounded-2xl border border-border overflow-hidden lg:sticky lg:top-20">
              {/* Header */}
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted-bg/30">
                <div>
                  <p className="font-extrabold text-foreground" dir="ltr">{selected.orderNumber}</p>
                  <p className="text-[11px] text-muted">{new Date(selected.createdAt).toLocaleString('he-IL')}</p>
                </div>
                <button onClick={() => selectOrder(null)} className="p-1.5 hover:bg-muted-bg rounded-lg transition-colors">
                  <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold ${STATUS_COLORS[selected.status]}`}>
                    {ORDER_STATUS_LABELS[selected.status]}
                  </span>
                  {selected.requiresApproval && !selected.approvedAt && (
                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      דורש אישור
                    </span>
                  )}
                </div>

                {/* Customer */}
                <section>
                  <h3 className="text-xs font-bold text-muted mb-2 uppercase tracking-wider">פרטי לקוח</h3>
                  <div className="bg-muted-bg/50 rounded-xl p-3.5 space-y-1.5 text-sm">
                    <p className="font-semibold text-foreground">{selected.customer.fullName}</p>
                    <p className="text-muted" dir="ltr">{selected.customer.email}</p>
                    <p className="text-muted" dir="ltr">{selected.customer.phone}</p>
                    {selected.customer.city && <p className="text-muted">{selected.customer.city}{selected.customer.address ? ` — ${selected.customer.address}` : ''}</p>}
                  </div>
                </section>

                {/* Items / Customizations */}
                <section>
                  <h3 className="text-xs font-bold text-muted mb-2 uppercase tracking-wider">פריטים והתאמות</h3>
                  <div className="space-y-3">
                    {selected.items.map((item, i) => (
                      <div key={i} className="bg-muted-bg/50 rounded-xl p-3.5">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-sm text-foreground">
                            {item.kind === 'studio_model' ? (item.localizedModelName || item.modelName) : item.title}
                          </p>
                          <span className="text-sm font-bold text-foreground shrink-0 me-3">{formatPrice(item.subtotal)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          <div>
                            <span className="text-muted">כמות:</span>
                            <span className="font-medium text-foreground mr-1">{item.quantity}</span>
                          </div>
                          <div>
                            <span className="text-muted">מחיר יחידה:</span>
                            <span className="font-medium text-foreground mr-1">{formatPrice(item.unitPrice)}</span>
                          </div>

                          {item.kind === 'studio_model' ? (
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="text-muted">צבע:</span>
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-gray-200 inline-block"
                                  style={{ backgroundColor: getFilamentColor(item.customization.filamentId) }}
                                />
                                <span className="font-medium text-foreground">{getFilamentName(item.customization.filamentId)}</span>
                              </div>
                              <div>
                                <span className="text-muted">קנ&quot;מ:</span>
                                <span className="font-medium text-foreground mr-1">×{item.customization.scale}</span>
                              </div>
                              {item.customization.dimensions && (
                                <div className="col-span-2">
                                  <span className="text-muted">מידות:</span>
                                  <span className="font-medium text-foreground mr-1" dir="ltr">
                                    {item.customization.dimensions.widthMm}×{item.customization.dimensions.heightMm}×{item.customization.dimensions.depthMm}mm
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="text-muted">מחלקה:</span>
                                <span className="font-medium text-foreground mr-1">{item.department}</span>
                              </div>
                              {item.kind === 'cities_bundle' && item.cities.length > 0 && (
                                <div className="col-span-2">
                                  <span className="text-muted">ערים:</span>
                                  <span className="font-medium text-foreground mr-1">
                                    {item.cities.map((c) => c.name).join(' · ')}
                                  </span>
                                </div>
                              )}
                              {item.attributes && item.attributes.length > 0 && (
                                <div className="col-span-2">
                                  <span className="text-muted">מאפיינים:</span>
                                  <span className="font-medium text-foreground mr-1">{item.attributes.join(' • ')}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Studio customization flags */}
                        {item.kind === 'studio_model' && item.customization.embossedText && (
                          <div className="mt-2.5 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                            <p className="text-[11px] font-bold text-amber-700 mb-0.5">טקסט חרוט</p>
                            <p className="text-sm text-amber-900 font-medium">&ldquo;{item.customization.embossedText}&rdquo;</p>
                          </div>
                        )}
                        {item.kind === 'studio_model' && item.customization.notes && (
                          <div className="mt-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-[11px] font-bold text-blue-700 mb-0.5">הערת לקוח</p>
                            <p className="text-xs text-blue-900">{item.customization.notes}</p>
                          </div>
                        )}
                        {item.kind === 'studio_model' && item.customization.referenceImages && item.customization.referenceImages.length > 0 && (
                          <div className="mt-2 p-2.5 bg-purple-50 rounded-lg border border-purple-100">
                            <p className="text-[11px] font-bold text-purple-700 mb-1">תמונות ייחוס ({item.customization.referenceImages.length})</p>
                            <div className="flex gap-1.5">
                              {item.customization.referenceImages.map((img) => (
                                <div key={img.id} className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5" />
                                  </svg>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Order Summary */}
                <section>
                  <h3 className="text-xs font-bold text-muted mb-2 uppercase tracking-wider">סיכום</h3>
                  <div className="bg-muted-bg/50 rounded-xl p-3.5 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">סכום ביניים</span>
                      <span className="text-foreground">{formatPrice(selected.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">משלוח</span>
                      <span className="text-foreground">{selected.shippingCost > 0 ? formatPrice(selected.shippingCost) : 'חינם'}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="font-bold text-foreground">סה&quot;כ</span>
                      <span className="font-extrabold text-primary text-base">{formatPrice(selected.total)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">קבלה</span>
                      <span className="text-foreground">{DELIVERY_METHOD_LABELS[selected.deliveryMethod]}</span>
                    </div>
                  </div>
                </section>

                {selected.customerNotes && (
                  <section>
                    <h3 className="text-xs font-bold text-muted mb-2 uppercase tracking-wider">הערות לקוח</h3>
                    <p className="text-sm text-foreground bg-muted-bg/50 rounded-xl p-3.5">{selected.customerNotes}</p>
                  </section>
                )}

                {/* Status History */}
                <section>
                  <h3 className="text-xs font-bold text-muted mb-2 uppercase tracking-wider">היסטוריית סטטוס</h3>
                  <div className="space-y-0">
                    {selected.statusHistory.map((entry, i) => (
                      <div key={i} className="flex gap-3 relative">
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                            i === selected.statusHistory.length - 1 ? 'bg-primary ring-4 ring-primary/10' : 'bg-gray-300'
                          }`} />
                          {i < selected.statusHistory.length - 1 && (
                            <div className="w-px flex-1 bg-gray-200 my-1" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="text-xs font-semibold text-foreground">{ORDER_STATUS_LABELS[entry.status]}</p>
                          <p className="text-[10px] text-muted">{new Date(entry.timestamp).toLocaleString('he-IL')}</p>
                          {entry.note && <p className="text-[11px] text-muted mt-0.5">{entry.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ─── Actions ─── */}
                {selected.status !== 'completed' && (
                  <section className="border-t border-border pt-4">
                    <h3 className="text-xs font-bold text-muted mb-3 uppercase tracking-wider">פעולות</h3>

                    {/* Approve/Reject for pending_approval */}
                    {selected.status === 'pending_approval' && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          disabled={actionLoading}
                          onClick={() => updateOrderStatus(selected.id, 'in_production', 'ההזמנה אושרה ועוברת לייצור')}
                          className="flex items-center justify-center gap-1.5 bg-success hover:bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          אשר
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => updateOrderStatus(selected.id, 'received', 'ההזמנה נדחתה — הוחזרה למצב התקבלה')}
                          className="flex items-center justify-center gap-1.5 bg-error hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                          דחה
                        </button>
                      </div>
                    )}

                    {/* Status advance */}
                    {nextStatuses(selected.status).length > 0 && selected.status !== 'pending_approval' && (
                      <div className="space-y-2">
                        <textarea
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="הערה (אופציונלי)..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-white text-foreground text-xs placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all resize-none"
                        />
                        <div className="flex flex-wrap gap-2">
                          {nextStatuses(selected.status).map((ns) => (
                            <button
                              key={ns}
                              disabled={actionLoading}
                              onClick={() => updateOrderStatus(selected.id, ns, statusNote || undefined)}
                              className="flex items-center gap-1.5 bg-foreground hover:bg-gray-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                              </svg>
                              העבר ל{ORDER_STATUS_LABELS[ns]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
