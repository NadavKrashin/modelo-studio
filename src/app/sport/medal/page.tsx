"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useCartStore } from "@/lib/store";

const PRICE = 89;
const COLOR_OPTIONS = [
  { name: "שחור", swatchCls: "bg-black" },
  { name: "לבן", swatchCls: "bg-white border border-gray-200" },
  { name: "בז'", swatchCls: "bg-stone-200" },
  { name: "אפור", swatchCls: "bg-gray-500" },
  { name: "כחול", swatchCls: "bg-blue-900" },
  { name: "אדום", swatchCls: "bg-red-800" },
] as const;

export default function SportMedalPage() {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const [step, setStep] = useState(0);
  const [color, setColor] = useState("");

  const totalSteps = 2;
  const progress = ((step + 1) / totalSteps) * 100;

  const canGoNext = useMemo(() => {
    if (step === 0) {
      return color.length > 0;
    }
    return true;
  }, [step, color]);

  const goNext = () => { if (canGoNext && step < totalSteps - 1) setStep((p) => p + 1); };
  const goBack = () => { if (step > 0) setStep((p) => p - 1); };

  const handleAddToCart = () => {
    addItem({
      kind: "simple",
      title: "משושה מדליה",
      imageUrl: "/images/sport/medal.jpeg",
      department: "sport",
      attributes: [
        `צבע: ${color}`,
      ],
      quantity: 1,
      unitPrice: PRICE,
      subtotal: PRICE,
    });
    openCart();
  };

  return (
    <div className="bg-white min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* ── Sticky Preview ── */}
        <aside className="lg:col-span-5 lg:sticky lg:top-6 h-fit">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">
            התאימו אישית — משושה מדליה
          </h1>
          <div className="mb-6 text-slate-500 text-sm font-medium">
            קוטר 12 ס״מ
          </div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white relative">
            <Image src="/images/sport/medal.jpeg" alt="משושה מדליה" fill className="object-cover" />
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-sm text-slate-500">מחיר</p>
            <p className="text-3xl font-extrabold text-slate-900">₪{PRICE}</p>
          </div>
        </aside>

        {/* ── Wizard ── */}
        <section className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 p-5 md:p-7">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                <span>שלב {step + 1} מתוך {totalSteps}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-black transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Step 0: Color */}
            {step === 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">בחירת צבע</h2>
                <p className="text-slate-600 mb-6">בחרו את הצבע למשושה המדליה שלכם.</p>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {COLOR_OPTIONS.map((c) => {
                    const active = color === c.name;
                    return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColor(c.name)}
                      className={`rounded-2xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-slate-300 ${active ? "border-black" : ""}`}
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={[
                            "w-12 h-12 rounded-full cursor-pointer flex-shrink-0 mx-auto transition-shadow",
                            c.swatchCls,
                            active ? "ring-2 ring-offset-2 ring-offset-white ring-black" : "",
                          ].join(" ")}
                          aria-label={c.name}
                        />
                        <span className="mt-3 font-bold text-sm text-slate-900">
                          {c.name}
                        </span>
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 1: Summary */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">סיכום והוספה לסל</h2>
                <p className="text-slate-600 mb-6">בדקו את הפרטים לפני ההוספה לסל.</p>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3 text-sm">
                  <Row label="מוצר" value="משושה מדליה" />
                  <Row label="צבע" value={color} />
                  <div className="border-t border-slate-200 pt-3 flex justify-between gap-4">
                    <span className="font-bold text-slate-900">סה&quot;כ</span>
                    <span className="text-xl font-extrabold text-black">₪{PRICE}</span>
                  </div>
                </div>

                <button onClick={handleAddToCart} className="mt-6 w-full rounded-2xl bg-black px-6 py-4 text-white font-bold text-lg hover:bg-slate-800 transition-all">
                  הוסף לסל — ₪{PRICE}
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-4">
              {step > 0 && (
                <button onClick={goBack} className="rounded-2xl border-2 border-slate-300 px-8 py-4 text-base font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all">
                  אחורה
                </button>
              )}
              {step < totalSteps - 1 && (
                <button onClick={goNext} disabled={!canGoNext} className="flex-1 rounded-2xl bg-black px-8 py-4 text-base font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-all">
                  הבא
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
