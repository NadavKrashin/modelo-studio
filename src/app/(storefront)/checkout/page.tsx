'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/pricing';
import type { DeliveryMethod } from '@/lib/types';
import { DELIVERY_METHOD_LABELS } from '@/lib/types/order';
import { FILAMENT_OPTIONS } from '@/lib/constants/filaments';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalItems } = useCartStore();
  const clearCart = useCartStore((s) => s.clearCart);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-fade-in">
        <p className="text-muted mb-4">הסל ריק</p>
        <Link href="/search" className="text-primary font-semibold hover:underline">חזרה לחיפוש</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { fullName, email, phone, city, address },
          items,
          deliveryMethod,
          notes: customerNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.details?.[0]?.message ?? err.error ?? 'שגיאה ביצירת ההזמנה');
        setIsSubmitting(false);
        return;
      }

      const confirmation = await res.json();
      clearCart();
      router.push(`/order/confirmation?orderNumber=${confirmation.orderNumber}`);
    } catch {
      alert('שגיאה בשליחת ההזמנה. נסו שוב.');
      setIsSubmitting(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder-gray-400 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted mb-8">
        <Link href="/cart" className="text-primary font-medium">סל</Link>
        <svg className="w-3 h-3 rotate-180 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        <span className="text-foreground font-bold">תשלום</span>
        <svg className="w-3 h-3 rotate-180 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        <span>אישור</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <form id="checkout-form" onSubmit={handleSubmit} className="lg:col-span-3 space-y-7">
          <h1 className="text-2xl font-extrabold text-foreground">השלמת הזמנה</h1>

          {/* Contact */}
          <section className="bg-white rounded-2xl border border-border/80 p-5 md:p-6">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white text-[11px] font-bold rounded-lg flex items-center justify-center">1</span>
              פרטי התקשרות
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">שם מלא *</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder="ישראל ישראלי" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">אימייל *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} dir="ltr" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">טלפון *</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} dir="ltr" placeholder="050-1234567" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">עיר</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="תל אביב" />
              </div>
            </div>
          </section>

          {/* Delivery */}
          <section className="bg-white rounded-2xl border border-border/80 p-5 md:p-6">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white text-[11px] font-bold rounded-lg flex items-center justify-center">2</span>
              אופן קבלה
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(DELIVERY_METHOD_LABELS) as [DeliveryMethod, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDeliveryMethod(key)}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                    deliveryMethod === key
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-border bg-white text-muted hover:border-gray-300'
                  }`}
                >
                  {key === 'shipping' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  )}
                  {label}
                </button>
              ))}
            </div>
            {deliveryMethod === 'shipping' && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-foreground mb-1.5">כתובת למשלוח</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} placeholder="רחוב, מספר בית, דירה" />
              </div>
            )}
          </section>

          {/* Notes */}
          <section className="bg-white rounded-2xl border border-border/80 p-5 md:p-6">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white text-[11px] font-bold rounded-lg flex items-center justify-center">3</span>
              הערות להזמנה
            </h2>
            <textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="הערות מיוחדות, זמני קבלה מועדפים..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </section>

          {/* Payment */}
          <section className="bg-white rounded-2xl border border-border/80 p-5 md:p-6">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white text-[11px] font-bold rounded-lg flex items-center justify-center">4</span>
              תשלום
            </h2>
            <div className="bg-muted-bg/60 rounded-xl p-6 text-center border border-dashed border-border">
              <svg className="w-8 h-8 text-muted/40 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
              </svg>
              <p className="text-sm font-medium text-muted mb-1">מערכת תשלום תשולב בקרוב</p>
              <p className="text-[11px] text-muted">התשלום ייגבה לאחר אישור ההזמנה על ידי הצוות</p>
            </div>
          </section>

          {/* Submit - Mobile only */}
          <div className="lg:hidden">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-[17px] transition-all shadow-xl shadow-primary/25"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  שולח הזמנה...
                </span>
              ) : (
                `אישור הזמנה — ${formatPrice(subtotal)}`
              )}
            </button>
          </div>
        </form>

        {/* Sidebar Summary */}
        <aside className="lg:col-span-2">
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-border/80 p-5">
              <h3 className="font-bold text-foreground mb-4">סיכום הזמנה ({totalItems})</h3>
              <div className="space-y-3 mb-4">
                {items.map((item) => {
                  const fil = FILAMENT_OPTIONS.find((f) => f.id === item.customization.filamentId);
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-muted-bg rounded-lg shrink-0 flex items-center justify-center relative overflow-hidden">
                        {item.thumbnailUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.thumbnailUrl}
                            alt={item.localizedModelName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-6 h-6 text-muted/30" viewBox="0 0 64 64" fill="none">
                            <path d="M32 14L48 23V41L32 50L16 41V23L32 14Z" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        )}
                        {fil && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: fil.colorHex }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.localizedModelName}</p>
                        <p className="text-[11px] text-muted">כמות: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-foreground shrink-0">{formatPrice(item.subtotal)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border pt-3 flex justify-between items-baseline">
                <span className="font-bold text-foreground">סה&quot;כ</span>
                <span className="text-xl font-extrabold text-primary">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-[10px] text-muted mt-1">לפני משלוח</p>
            </div>

            {/* Submit - Desktop */}
            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="hidden lg:flex w-full items-center justify-center bg-primary hover:bg-primary-hover disabled:opacity-60 text-white py-4 rounded-2xl font-bold text-[17px] transition-all shadow-xl shadow-primary/25"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  שולח...
                </span>
              ) : (
                `אישור הזמנה — ${formatPrice(subtotal)}`
              )}
            </button>

            <p className="text-center text-[10px] text-muted">
              בלחיצה על &quot;אישור הזמנה&quot; אתם מאשרים את תנאי השירות
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
