'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SafeCartItemImg } from '@/components/SafeCartItemImage';
import { CouponInput } from '@/components/cart/CouponInput';
import { useCartStore } from '@/lib/store';
import { computeCartTotal, computeDiscountAmount } from '@/lib/store/cart-discount';
import { formatPrice } from '@/lib/pricing';
import type { CartItem, DeliveryMethod, FilamentOption } from '@/lib/types';
import { DELIVERY_METHOD_LABELS } from '@/lib/types/order';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const totalItems = useCartStore((s) => s.totalItems);
  const clearCart = useCartStore((s) => s.clearCart);

  const discountAmount = useMemo(
    () => computeDiscountAmount(subtotal, appliedCoupon),
    [subtotal, appliedCoupon],
  );
  const cartTotalAfterDiscount = useMemo(
    () => computeCartTotal(subtotal, appliedCoupon),
    [subtotal, appliedCoupon],
  );

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableFilaments, setAvailableFilaments] = useState<FilamentOption[]>([]);

  const shippingCost = deliveryMethod === 'shipping' ? 35 : 0;
  const orderGrandTotal = cartTotalAfterDiscount + shippingCost;

  const needsFilaments = useMemo(
    () => items.some((i) => i.kind === 'studio_model'),
    [items],
  );

  useEffect(() => {
    if (!needsFilaments) return;
    fetch('/api/filaments')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: FilamentOption[]) => setAvailableFilaments(Array.isArray(data) ? data : []))
      .catch(() => setAvailableFilaments([]));
  }, [needsFilaments]);

  const getFilamentName = (filamentId: string) =>
    availableFilaments.find((f) => f.id === filamentId)?.localizedName;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-fade-in">
        <p className="text-muted mb-4">הסל ריק</p>
        <Link href="/" className="text-primary font-semibold hover:underline">
          חזרה לעמוד הבית
        </Link>
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
          discountAmount,
          couponCode: appliedCoupon?.code,
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
      router.push(`/studio/order/confirmation?orderNumber=${confirmation.orderNumber}`);
    } catch {
      alert('שגיאה בשליחת ההזמנה. נסו שוב.');
      setIsSubmitting(false);
    }
  };

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder-gray-400 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-center gap-2 text-xs text-muted mb-8">
        <Link href="/cart" className="text-primary font-medium">
          סל
        </Link>
        <svg className="w-3 h-3 rotate-180 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-foreground font-bold">תשלום</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <form id="checkout-form" onSubmit={handleSubmit} className="lg:col-span-3 space-y-7">
          <h1 className="text-2xl font-extrabold text-foreground">השלמת הזמנה</h1>

          <section className="bg-white rounded-2xl border border-border/80 p-5 md:p-6">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white text-[11px] font-bold rounded-lg flex items-center justify-center">
                1
              </span>
              פרטי התקשרות
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">שם מלא *</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">אימייל *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">טלפון *</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-border/80 p-5 md:p-6">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white text-[11px] font-bold rounded-lg flex items-center justify-center">
                2
              </span>
              משלוח
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(['shipping', 'pickup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDeliveryMethod(m)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    deliveryMethod === m ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted-bg'
                  }`}
                >
                  {DELIVERY_METHOD_LABELS[m]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">עיר</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">כתובת</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-foreground mb-1.5">הערות</label>
              <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} className={`${inputCls} min-h-[90px]`} />
            </div>
          </section>
        </form>

        <aside className="lg:col-span-2">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-border/80 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-foreground">סיכום</h2>
                <span className="text-xs text-muted">{totalItems} פריטים</span>
              </div>
              <CouponInput className="mb-4" />
              <div className="space-y-3 mb-4">
                {items.map((item: CartItem) => {
                  const thumbUrl =
                    item.kind === 'studio_model' ? item.thumbnailUrl : item.imageUrl;
                  const thumbAlt =
                    item.kind === 'studio_model' ? item.localizedModelName : item.title;
                  return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted-bg overflow-hidden shrink-0 flex items-center justify-center">
                      {thumbUrl ? (
                        <SafeCartItemImg key={`${item.id}-${thumbUrl}`} src={thumbUrl} alt={thumbAlt} />
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.kind === 'studio_model' ? item.localizedModelName : item.title}
                      </p>
                      <p className="text-[11px] text-muted">
                        כמות: {item.quantity}
                        {item.kind === 'studio_model' ? ` • ${getFilamentName(item.customization.filamentId) ?? ''}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-foreground shrink-0">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                  );
                })}
              </div>
              <div className="space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex justify-between gap-3 text-muted">
                  <span>סיכום ביניים</span>
                  <span className="font-semibold text-foreground tabular-nums" dir="ltr">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">הנחה</span>
                    <span className="font-bold text-red-600 tabular-nums" dir="ltr">
                      −{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-3 text-muted">
                  <span>{DELIVERY_METHOD_LABELS[deliveryMethod]}</span>
                  <span className="font-semibold text-foreground tabular-nums" dir="ltr">
                    {shippingCost > 0 ? formatPrice(shippingCost) : '₪0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-3 border-t border-border pt-2">
                  <span className="font-bold text-foreground">סה&quot;כ לתשלום</span>
                  <span className="text-xl font-extrabold text-primary tabular-nums" dir="ltr">
                    {formatPrice(orderGrandTotal)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center bg-primary hover:bg-primary-hover disabled:opacity-60 text-white py-4 rounded-2xl font-bold text-[17px] transition-all shadow-xl shadow-primary/25"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  שולח...
                </span>
              ) : (
                `אישור הזמנה — ${formatPrice(orderGrandTotal)}`
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

