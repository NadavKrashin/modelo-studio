"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useSportFilaments } from "@/hooks/useSportFilaments";
import { hexNeedsLightBorder } from "@/lib/firebase/sport-filaments";
import type { Filament } from "@/lib/types";
import { useCartStore } from "@/lib/store";

const PRICE = 129;

function hexForName(items: Filament[], name: string): string {
  return items.find((f) => f.name === name)?.hexColor ?? "#0f172a";
}

export default function SportDetailsPage() {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { items: sportFilaments, loading: colorsLoading, error: colorsError } = useSportFilaments();

  const [step, setStep] = useState(0);
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [line3, setLine3] = useState("");
  const [frameColorChoice, setFrameColorChoice] = useState<string | null>(null);
  const [titleColorChoice, setTitleColorChoice] = useState<string | null>(null);
  const [line2ColorChoice, setLine2ColorChoice] = useState<string | null>(null);
  const [line3ColorChoice, setLine3ColorChoice] = useState<string | null>(null);

  const defaultName = sportFilaments[0]?.name ?? "";
  const titleColor = titleColorChoice ?? defaultName;
  const line2Color = line2ColorChoice ?? defaultName;
  const line3Color = line3ColorChoice ?? defaultName;
  const frameColor = frameColorChoice ?? defaultName;

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  const canGoNext = useMemo(() => {
    if (colorsLoading || sportFilaments.length === 0) return false;
    if (step === 0) {
      return (
        line1.trim().length > 0 &&
        sportFilaments.some((f) => f.name === titleColor) &&
        sportFilaments.some((f) => f.name === line2Color) &&
        sportFilaments.some((f) => f.name === line3Color)
      );
    }
    if (step === 1) {
      return sportFilaments.some((f) => f.name === frameColor);
    }
    return true;
  }, [step, line1, colorsLoading, sportFilaments, titleColor, line2Color, line3Color, frameColor]);

  const goNext = () => {
    if (canGoNext && step < totalSteps - 1) setStep((p) => p + 1);
  };
  const goBack = () => {
    if (step > 0) setStep((p) => p - 1);
  };

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
        `צבע כותרת: ${titleColor}`,
        `צבע שורה 2: ${line2Color}`,
        `צבע שורה 3: ${line3Color}`,
        `צבע מסגרת: ${frameColor}`,
      ],
      quantity: 1,
      unitPrice: PRICE,
      subtotal: PRICE,
    });
    openCart();
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-black/10 focus:border-black";

  const selectCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:ring-2 focus:ring-black/10 focus:border-black";

  return (
    <div className="bg-white min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <aside className="lg:col-span-5 lg:sticky lg:top-6 h-fit">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">
            התאימו אישית — משושה תיאור מירוץ
          </h1>
          <div className="mb-5 text-slate-500 text-sm font-medium">קוטר 12 ס״מ</div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white relative">
            <Image src="/images/sport/detail.jpeg" alt="משושה תיאור מירוץ" fill className="object-cover" />
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
              <div className="w-full text-center">
                {line1.trim().length > 0 && (
                  <div
                    style={{ color: hexForName(sportFilaments, titleColor) }}
                    className="font-extrabold text-base md:text-lg leading-tight"
                  >
                    {line1}
                  </div>
                )}
                {(line2.trim().length > 0 || line3.trim().length > 0) && (
                  <div className="mt-1 space-y-1">
                    {line2.trim().length > 0 && (
                      <div
                        style={{ color: hexForName(sportFilaments, line2Color) }}
                        className="font-semibold text-[11px] md:text-sm leading-tight"
                      >
                        {line2}
                      </div>
                    )}
                    {line3.trim().length > 0 && (
                      <div
                        style={{ color: hexForName(sportFilaments, line3Color) }}
                        className="font-semibold text-[11px] md:text-sm leading-tight"
                      >
                        {line3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-sm text-slate-500">מחיר</p>
            <p className="text-3xl font-extrabold text-slate-900">₪{PRICE}</p>
          </div>
        </aside>

        <section className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 p-5 md:p-7">
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                <span>
                  שלב {step + 1} מתוך {totalSteps}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {step === 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">הכנסת טקסט וצבעים</h2>
                <p className="text-slate-600 mb-6">הזינו את הטקסט ובחרו צבע לכל שורה מתוך צבעי הספורט הזמינים.</p>

                {colorsLoading ? (
                  <p className="text-sm text-slate-500">טוען צבעי ספורט…</p>
                ) : colorsError ? (
                  <p className="text-sm text-red-600">טעינת צבעים נכשלה: {colorsError}</p>
                ) : sportFilaments.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    אין כרגע צבעי ספורט זמינים במלאי. לא ניתן להמשיך בהזמנה.
                  </p>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-bold text-slate-900 mb-1.5">
                          כותרת (חובה, עד 15 תווים)
                        </label>
                        <input
                          type="text"
                          value={line1}
                          onChange={(e) => setLine1(e.target.value.slice(0, 15))}
                          maxLength={15}
                          placeholder="לדוגמה: מרתון תל אביב"
                          className={`${inputCls} font-bold`}
                        />
                        <p className="mt-1 text-xs text-slate-400 text-left" dir="ltr">
                          {line1.length}/15
                        </p>
                      </div>
                      <div className="w-full shrink-0 sm:w-52">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5">צבע כותרת</label>
                        <select
                          className={selectCls}
                          value={titleColor}
                          onChange={(e) => setTitleColorChoice(e.target.value)}
                        >
                          {sportFilaments.map((f) => (
                            <option key={f.id} value={f.name}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-bold text-slate-900 mb-1.5">
                          שורה 2 (אופציונלי, עד 30 תווים)
                        </label>
                        <input
                          type="text"
                          value={line2}
                          onChange={(e) => setLine2(e.target.value.slice(0, 30))}
                          maxLength={30}
                          placeholder="לדוגמה: 28.02.2026 | 42.195 ק״מ"
                          className={inputCls}
                        />
                        <p className="mt-1 text-xs text-slate-400 text-left" dir="ltr">
                          {line2.length}/30
                        </p>
                      </div>
                      <div className="w-full shrink-0 sm:w-52">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5">צבע שורה 2</label>
                        <select
                          className={selectCls}
                          value={line2Color}
                          onChange={(e) => setLine2ColorChoice(e.target.value)}
                        >
                          {sportFilaments.map((f) => (
                            <option key={f.id} value={f.name}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-bold text-slate-900 mb-1.5">
                          שורה 3 (אופציונלי, עד 30 תווים)
                        </label>
                        <input
                          type="text"
                          value={line3}
                          onChange={(e) => setLine3(e.target.value.slice(0, 30))}
                          maxLength={30}
                          placeholder="לדוגמה: זמן סיום — 03:45:12"
                          className={inputCls}
                        />
                        <p className="mt-1 text-xs text-slate-400 text-left" dir="ltr">
                          {line3.length}/30
                        </p>
                      </div>
                      <div className="w-full shrink-0 sm:w-52">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5">צבע שורה 3</label>
                        <select
                          className={selectCls}
                          value={line3Color}
                          onChange={(e) => setLine3ColorChoice(e.target.value)}
                        >
                          {sportFilaments.map((f) => (
                            <option key={f.id} value={f.name}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">בחירת צבע מסגרת</h2>
                <div className="mb-5 text-slate-500 text-sm font-medium">קוטר 12 ס״מ</div>
                <p className="text-slate-600 mb-6">בחרו את צבע המסגרת סביב המשושה.</p>

                {colorsLoading ? (
                  <p className="text-sm text-slate-500">טוען צבעי ספורט…</p>
                ) : colorsError ? (
                  <p className="text-sm text-red-600">טעינת צבעים נכשלה: {colorsError}</p>
                ) : sportFilaments.length === 0 ? (
                  <p className="text-sm text-slate-600">אין צבעים זמינים.</p>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {sportFilaments.map((c) => {
                      const active = frameColor === c.name;
                      const border = hexNeedsLightBorder(c.hexColor);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFrameColorChoice(c.name)}
                          className="rounded-2xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-slate-300"
                        >
                          <div className="flex flex-col items-center">
                            <span
                              className={[
                                "w-12 h-12 rounded-full mx-auto cursor-pointer flex-shrink-0 transition-shadow",
                                border ? "border border-slate-200" : "",
                                active ? "ring-2 ring-offset-2 ring-offset-white ring-black" : "",
                              ].join(" ")}
                              style={{ backgroundColor: c.hexColor }}
                              aria-label={c.name}
                            />
                            <span className="mt-3 font-bold text-sm text-slate-900">{c.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">סיכום והוספה לסל</h2>
                <p className="text-slate-600 mb-6">בדקו את הפרטים לפני ההוספה לסל.</p>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3 text-sm">
                  <Row label="מוצר" value="משושה תיאור מירוץ" />
                  <Row label="כותרת" value={line1} />
                  <Row label="שורה 2" value={line2 || "-"} />
                  <Row label="שורה 3" value={line3 || "-"} />
                  <Row label="צבע כותרת" value={titleColor} />
                  <Row label="צבע שורה 2" value={line2Color} />
                  <Row label="צבע שורה 3" value={line3Color} />
                  <Row label="צבע מסגרת" value={frameColor} />
                  <div className="border-t border-slate-200 pt-3 flex justify-between gap-4">
                    <span className="font-bold text-slate-900">סה&quot;כ</span>
                    <span className="text-xl font-extrabold text-black">₪{PRICE}</span>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!frameColor || !titleColor}
                  className="mt-6 w-full rounded-2xl bg-black px-6 py-4 text-white font-bold text-lg hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  הוסף לסל — ₪{PRICE}
                </button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-4">
              {step > 0 && (
                <button
                  onClick={goBack}
                  className="rounded-2xl border-2 border-slate-300 px-8 py-4 text-base font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  אחורה
                </button>
              )}
              {step < totalSteps - 1 && (
                <button
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="flex-1 rounded-2xl bg-black px-8 py-4 text-base font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-all"
                >
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
