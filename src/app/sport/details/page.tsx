"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";

const PRICE = 129;

const FONT_COLORS = [
  { name: "לבן", hex: "#FFFFFF", border: true },
  { name: "שחור", hex: "#000000", border: false },
  { name: "כחול חשמלי", hex: "#2563EB", border: false },
  { name: "ירוק יער", hex: "#166534", border: false },
  { name: "כתום שקיעה", hex: "#EA580C", border: false },
] as const;

export default function SportDetailsPage() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [step, setStep] = useState(0);
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [line3, setLine3] = useState("");
  const [fontColor, setFontColor] = useState("");

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  const canGoNext = useMemo(() => {
    if (step === 0) return line1.trim().length > 0;
    if (step === 1) return fontColor.length > 0;
    return true;
  }, [step, line1, fontColor]);

  const goNext = () => { if (canGoNext && step < totalSteps - 1) setStep((p) => p + 1); };
  const goBack = () => { if (step > 0) setStep((p) => p - 1); };

  const handleAddToCart = () => {
    addItem({
      kind: "simple",
      title: "משושה תיאור מירוץ",
      imageUrl: "/images/sport/detail.jpeg",
      department: "sport",
      attributes: [
        `כותרת: ${line1}`,
        line2 ? `שורה 2: ${line2}` : "שורה 2: -",
        line3 ? `שורה 3: ${line3}` : "שורה 3: -",
        `צבע פונט: ${fontColor}`,
      ],
      quantity: 1,
      unitPrice: PRICE,
      subtotal: PRICE,
    });
    router.push("/cart");
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-black/10 focus:border-black";

  return (
    <div className="bg-white min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* ── Sticky Preview ── */}
        <aside className="lg:col-span-5 lg:sticky lg:top-6 h-fit">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">
            התאימו אישית — משושה תיאור מירוץ
          </h1>
          <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white relative">
            <Image src="/images/sport/detail.jpeg" alt="משושה תיאור מירוץ" fill className="object-cover" />
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

            {/* Step 0: Text input */}
            {step === 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">הכנסת טקסט</h2>
                <p className="text-slate-600 mb-6">הזינו את הטקסט שיופיע על המשושה שלכם.</p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-1.5">כותרת (חובה)</label>
                    <input
                      type="text"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value.slice(0, 15))}
                      maxLength={15}
                      placeholder="לדוגמה: מרתון תל אביב"
                      className={`${inputCls} font-bold`}
                    />
                    <p className="mt-1 text-xs text-slate-400 text-left" dir="ltr">{line1.length}/15</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-1.5">שורה 2 (אופציונלי)</label>
                    <input
                      type="text"
                      value={line2}
                      onChange={(e) => setLine2(e.target.value.slice(0, 30))}
                      maxLength={30}
                      placeholder="לדוגמה: 28.02.2026 | 42.195 ק״מ"
                      className={inputCls}
                    />
                    <p className="mt-1 text-xs text-slate-400 text-left" dir="ltr">{line2.length}/30</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-1.5">שורה 3 (אופציונלי)</label>
                    <input
                      type="text"
                      value={line3}
                      onChange={(e) => setLine3(e.target.value.slice(0, 30))}
                      maxLength={30}
                      placeholder="לדוגמה: זמן סיום — 03:45:12"
                      className={inputCls}
                    />
                    <p className="mt-1 text-xs text-slate-400 text-left" dir="ltr">{line3.length}/30</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Font color */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">בחירת צבע פונט</h2>
                <p className="text-slate-600 mb-6">בחרו את צבע הטקסט שיופיע על המשושה.</p>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                  {FONT_COLORS.map((fc) => {
                    const active = fontColor === fc.name;
                    return (
                      <button
                        key={fc.name}
                        onClick={() => setFontColor(fc.name)}
                        className={`flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all ${active ? "border-black shadow-lg scale-105" : "border-slate-200 hover:border-slate-300"}`}
                      >
                        <span
                          className={`w-10 h-10 rounded-full ${fc.border ? "border border-slate-300" : ""}`}
                          style={{ backgroundColor: fc.hex }}
                        />
                        <span className={`text-xs font-bold ${active ? "text-black" : "text-slate-500"}`}>{fc.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Summary */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">סיכום והוספה לסל</h2>
                <p className="text-slate-600 mb-6">בדקו את הפרטים לפני ההוספה לסל.</p>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3 text-sm">
                  <Row label="מוצר" value="משושה תיאור מירוץ" />
                  <Row label="כותרת" value={line1} />
                  <Row label="שורה 2" value={line2 || "-"} />
                  <Row label="שורה 3" value={line3 || "-"} />
                  <Row label="צבע פונט" value={fontColor} />
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
