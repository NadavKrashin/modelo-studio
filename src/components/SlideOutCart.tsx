"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { SafeCartItemImage } from "@/components/SafeCartItemImage";
import { CouponInput } from "@/components/cart/CouponInput";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { computeCartTotal, computeDiscountAmount } from "@/lib/store/cart-discount";
import { formatPrice } from "@/lib/pricing";

export function SlideOutCart() {
  const isOpen = useCartStore((s) => s.isCartOpen);
  const close = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const totalItems = useCartStore((s) => s.totalItems);
  const discountAmount = useMemo(
    () => computeDiscountAmount(subtotal, appliedCoupon),
    [subtotal, appliedCoupon],
  );
  const cartTotal = useMemo(
    () => computeCartTotal(subtotal, appliedCoupon),
    [subtotal, appliedCoupon],
  );
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        dir="rtl"
        aria-label="סל קניות"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
          <h2 className="text-xl font-extrabold text-slate-900">
            העגלה שלך
            {totalItems > 0 && (
              <span className="text-sm font-medium text-slate-400 mr-2">({totalItems})</span>
            )}
          </h2>
          <button
            onClick={close}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
            aria-label="סגור"
          >
            <X className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
          </button>
        </div>

        {/* ── Items ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-slate-900 mb-1">הסל ריק</p>
              <p className="text-sm text-slate-400">עדיין לא הוספתם מוצרים.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const isStudio = item.kind === "studio_model";
                const imageUrl = isStudio ? item.thumbnailUrl : item.imageUrl;
                const title = isStudio ? item.localizedModelName : item.title;
                const attrs = !isStudio && item.attributes ? item.attributes : [];

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl bg-slate-100 shrink-0 relative overflow-hidden">
                      {imageUrl ? (
                        <SafeCartItemImage key={`${item.id}-${imageUrl}`} src={imageUrl} alt={title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-slate-300" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path d="M32 12L50 22V42L32 52L14 42V22L32 12Z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-sm text-slate-900 leading-tight">{title}</p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          aria-label="הסרה"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                        </button>
                      </div>

                      {attrs.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {attrs.join(" · ")}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
                          >
                            <Minus className="w-3 h-3 text-slate-600" strokeWidth={2} />
                          </button>
                          <span className="text-sm font-bold min-w-[1.5ch] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
                          >
                            <Plus className="w-3 h-3 text-slate-600" strokeWidth={2} />
                          </button>
                        </div>
                        <span className="font-extrabold text-sm text-black">₪{item.subtotal}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {items.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-5 shrink-0 space-y-4">
            <CouponInput compact />
            <div className="space-y-2 text-sm">
              <div className="flex items-baseline justify-between text-slate-600">
                <span>סיכום ביניים</span>
                <span className="font-semibold text-slate-900 tabular-nums" dir="ltr">
                  {formatPrice(subtotal)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-600">הנחה</span>
                  <span className="font-bold text-red-600 tabular-nums" dir="ltr">
                    −{formatPrice(discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-slate-200 pt-2">
                <span className="font-bold text-slate-900">סה&quot;כ</span>
                <span className="text-2xl font-extrabold text-black tabular-nums" dir="ltr">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">לפני משלוח</p>
            </div>
            <Link
              href="/checkout"
              onClick={close}
              className="flex items-center justify-center w-full rounded-2xl bg-black py-4 text-white font-bold text-base hover:bg-slate-800 transition-colors"
            >
              מעבר לתשלום — {formatPrice(cartTotal)}
            </Link>
            <Link
              href="/cart"
              onClick={close}
              className="flex w-full items-center justify-center rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              לסל המלא
            </Link>
            <button
              onClick={close}
              className="w-full text-center text-sm text-slate-500 hover:text-black transition-colors font-medium py-1"
            >
              המשך לקנות
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
