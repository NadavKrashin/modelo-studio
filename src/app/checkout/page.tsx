"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const { items } = useCart();
  const [shippingMethod, setShippingMethod] = useState<"delivery" | "pickup">("delivery");

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = shippingMethod === "delivery" ? 39 : 0;
  const finalTotal = subtotal + shippingCost;

  const inputClass =
    "border border-gray-300 rounded-md p-3 w-full mb-4 outline-none transition-all focus:ring-2 focus:ring-black";

  return (
    <div className="min-h-screen bg-white text-slate-900" dir="rtl">
      <header className="border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <Link href="/" aria-label="חזרה לדף הבית">
            <Image
              src="/images/logo/logo-main.jpeg"
              alt="Modelo"
              width={260}
              height={80}
              className="w-48 md:w-64 h-auto object-contain"
              priority
            />
          </Link>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto">
        <section className="lg:col-span-7 bg-white p-6 sm:p-8 lg:p-12">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold mb-4">פרטי קשר</h2>
            <input type="email" placeholder="כתובת אימייל" className={inputClass} />
            <input
              type="tel"
              dir="rtl"
              placeholder="מספר טלפון"
              className={`${inputClass} text-right`}
            />

            <h2 className="text-xl font-bold mb-4 mt-8">כתובת למשלוח</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" placeholder="שם פרטי" className={inputClass} />
              <input type="text" placeholder="שם משפחה" className={inputClass} />
            </div>
            <input type="text" placeholder="חברה (אופציונלי)" className={inputClass} />
            <input type="text" placeholder="כתובת" className={inputClass} />
            <input type="text" placeholder="עיר" className={inputClass} />

            <h2 className="text-xl font-bold mb-4 mt-8">שיטת משלוח</h2>
            <div className="border border-gray-300 rounded-lg p-4 mb-6">
              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping-method"
                    checked={shippingMethod === "delivery"}
                    onChange={() => setShippingMethod("delivery")}
                    className="accent-black"
                  />
                  <span>משלוח עד הבית (עד 10 ימי עסקים)</span>
                </div>
                <span>₪39.00</span>
              </label>
              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping-method"
                    checked={shippingMethod === "pickup"}
                    onChange={() => setShippingMethod("pickup")}
                    className="accent-black"
                  />
                  <span>איסוף עצמי (חינם)</span>
                </div>
                <span>₪0.00</span>
              </label>
            </div>

            <h2 className="text-xl font-bold mb-1">תשלום</h2>
            <p className="text-sm text-slate-600 mb-4">כל התשלומים מאובטחים ומוצפנים.</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <button className="bg-black text-white rounded-md py-3 font-semibold hover:bg-slate-800 transition-all">
                Apple Pay
              </button>
              <button className="bg-white text-black border border-black rounded-md py-3 font-semibold hover:bg-gray-50 transition-all">
                Google Pay
              </button>
            </div>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px bg-gray-300 flex-1" />
              <span className="text-sm text-gray-500">או שלמו באשראי</span>
              <div className="h-px bg-gray-300 flex-1" />
            </div>

            <input type="text" placeholder="מספר כרטיס" className={inputClass} />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="תוקף (MM/YY)" className={inputClass} />
              <input type="text" placeholder="CVV" className={inputClass} />
            </div>
            <input type="text" placeholder="שם בעל הכרטיס" className={inputClass} />

            <button className="bg-black text-white py-4 rounded-lg font-bold text-lg mt-8 w-full hover:bg-slate-800 transition-all">
              שלם עכשיו ₪{finalTotal}
            </button>
          </div>
        </section>

        <aside className="lg:col-span-5 bg-gray-50 lg:border-r border-gray-200 sticky top-0 h-screen overflow-y-auto p-6 sm:p-8">
          <h3 className="text-xl font-bold mb-6">סיכום הזמנה</h3>

          <div className="space-y-5">
            {items.map((item) => (
              <article key={item.id} className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="relative w-16 h-16 border rounded-md bg-white overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                      {item.quantity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-900 leading-relaxed">{item.name}</p>
                </div>
                <span className="text-sm font-semibold shrink-0">₪{item.price * item.quantity}</span>
              </article>
            ))}
          </div>

          <div className="mt-8 border-t border-gray-200 pt-5 space-y-3">
            <div className="flex items-center justify-between text-slate-700">
              <span>סכום ביניים</span>
              <span>₪{subtotal}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>משלוח</span>
              <span>{shippingMethod === "delivery" ? "₪39.00" : "חינם"}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="font-semibold">סה״כ</span>
              <span className="text-2xl font-bold">₪{finalTotal}</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
