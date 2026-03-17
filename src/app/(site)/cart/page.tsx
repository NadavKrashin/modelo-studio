"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeFromCart } = useCart();

  if (items.length === 0) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-24 text-center" dir="rtl">
        <h1 className="text-4xl font-extrabold mb-6 text-slate-900">עגלת קניות</h1>
        <p className="text-slate-600 mb-8">העגלה שלך ריקה</p>
        <Link
          href="/studio"
          className="inline-flex items-center justify-center bg-black text-white px-8 py-3 rounded-full hover:bg-slate-800 transition-all"
        >
          חזרה לחנות
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-16" dir="rtl">
      <h1 className="text-4xl font-extrabold mb-12 text-center text-slate-900">עגלת קניות</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
        <div className="lg:col-span-2">
          {items.map((item) => {
            const lineTotal = item.price * item.quantity;
            return (
              <article
                key={item.id}
                className="border-b border-gray-200 py-6 flex flex-col sm:flex-row gap-4 sm:gap-6"
              >
                <div className="w-28 h-28 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{item.name}</h2>
                      {item.attributes && item.attributes.length > 0 && (
                        <p className="text-sm text-slate-500 mt-1">{item.attributes.join(" • ")}</p>
                      )}
                    </div>
                    <span className="text-lg font-semibold text-slate-900">₪{lineTotal}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-9 h-9 text-slate-700 hover:bg-gray-100 transition-all"
                        aria-label="הפחתה"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-9 h-9 text-slate-700 hover:bg-gray-100 transition-all"
                        aria-label="הוספה"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-sm text-slate-500 underline hover:text-slate-800 transition-colors"
                    >
                      הסר
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="border border-gray-200 rounded-2xl p-6 h-fit">
          <h3 className="text-lg font-semibold text-slate-900 mb-5">סיכום הזמנה</h3>
          <div className="flex items-center justify-between text-slate-700 mb-5">
            <span>סכום ביניים</span>
            <span>₪{subtotal}</span>
          </div>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="קוד קופון"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
            />
            <button className="border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-100 transition-all">
              החל
            </button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-slate-900">סה״כ לתשלום</span>
            <span className="font-bold text-2xl text-slate-900">₪{subtotal}</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            מיסים יחושבו (במידה ויש) בקופה. דמי משלוח יתווספו בשלב הבא.
          </p>

          <Link
            href="/checkout"
            className="block text-center bg-black text-white py-4 w-full rounded-xl font-semibold hover:bg-slate-800 transition-all"
          >
            המשך לתשלום
          </Link>
        </aside>
      </div>
    </section>
  );
}
