"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";

const PRICE = 89;
const COLOR_OPTIONS = ["שחור", "לבן"] as const;

export default function SportMedalPage() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [step, setStep] = useState(0);
  const [color, setColor] = useState("");
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [customColor, setCustomColor] = useState("");

  const totalSteps = 2;
  const progress = ((step + 1) / totalSteps) * 100;

  const selectedColor = isCustomColor ? customColor : color;

  const canGoNext = useMemo(() => {
    if (step === 0) {
      if (isCustomColor) return customColor.trim().length > 0;
      return color.length > 0;
    }
    return true;
  }, [step, color, isCustomColor, customColor]);

  const goNext = () => { if (canGoNext && step < totalSteps - 1) setStep((p) => p + 1); };
  const goBack = () => { if (step > 0) setStep((p) => p - 1); };

  const handleSelectColor = (c: string) => {
    setColor(c);
    setIsCustomColor(false);
    setCustomColor("");
  };

  const handleSelectCustom = () => {
    setColor("");
    setIsCustomColor(true);
  };

  const handleAddToCart = () => {
    addItem({
      kind: "simple",
      title: "משושה מדליה",
      imageUrl: "/images/sport/medal.jpeg",
      department: "sport",
      attributes: [
        `צבע: ${isCustomColor ? `אחר — ${customColor}` : color}`,
      ],
      quantity: 1,
      unitPrice: PRICE,
      subtotal: PRICE,
    });
    router.push("/cart");
  };

  const cardCls = (active: boolean) =>
    active
      ? "border-black bg-black text-white shadow-lg"
      : "border-slate-200 bg-white hover:border-slate-300";

  return (
    <div className="bg-white min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* ── Sticky Preview ── */}
        <aside className="lg:col-span-5 lg:sticky lg:top-6 h-fit">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">
            התאימו אישית — משושה מדליה
          </h1>
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

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSelectColor(c)}
                      className={`rounded-2xl border-2 p-5 text-right transition-all ${cardCls(!isCustomColor && color === c)}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full border ${c === "שחור" ? "bg-black border-transparent" : "bg-white border-slate-300"}`} />
                        <span className="font-bold">{c}</span>
                      </div>
                    </button>
                  ))}

                  <button
                    onClick={handleSelectCustom}
                    className={`rounded-2xl border-2 p-5 text-right transition-all ${cardCls(isCustomColor)}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-dashed border-slate-400 bg-gradient-to-br from-rose-200 via-blue-200 to-emerald-200" />
                      <span className="font-bold">אחר</span>
                    </div>
                  </button>
                </div>

                {isCustomColor && (
                  <div className="mt-5">
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value.slice(0, 20))}
                      maxLength={20}
                      placeholder="תארו את הצבע הרצוי (עד 20 תווים)"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                    />
                    <p className="mt-1 text-xs text-slate-400 text-left" dir="ltr">{customColor.length}/20</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Summary */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">סיכום והוספה לסל</h2>
                <p className="text-slate-600 mb-6">בדקו את הפרטים לפני ההוספה לסל.</p>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3 text-sm">
                  <Row label="מוצר" value="משושה מדליה" />
                  <Row label="צבע" value={isCustomColor ? `אחר — ${customColor}` : color} />
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
