"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { CheckCircle, UploadCloud, Trophy, Frame, Map } from "lucide-react";
import { useSportFilaments } from "@/hooks/useSportFilaments";
import { hexNeedsLightBorder } from "@/lib/firebase/sport-filaments";
import { useCartStore } from "@/lib/store";

const BASE_PRICE = 189;
const FRAME_ADDON = 50;

export default function SportRoutePage() {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { items: sportFilaments, loading: colorsLoading, error: colorsError } = useSportFilaments();

  const [step, setStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [raceName, setRaceName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [distance, setDistance] = useState("");
  const [wantsFrame, setWantsFrame] = useState(false);
  const [frameColorChoice, setFrameColorChoice] = useState<string | null>(null);
  const frameColor = frameColorChoice ?? sportFilaments[0]?.name ?? "";

  const totalSteps = 5;
  const totalPrice = useMemo(() => BASE_PRICE + (wantsFrame ? FRAME_ADDON : 0), [wantsFrame]);
  const progress = ((step + 1) / totalSteps) * 100;

  const canGoNext = useMemo(() => {
    if (step === 0) return Boolean(uploadedFile);
    if (step === 1) return Boolean(raceName.trim() && participantName.trim() && distance.trim());
    if (step === 2) {
      if (colorsLoading || sportFilaments.length === 0) return false;
      return sportFilaments.some((f) => f.name === frameColor);
    }
    return true;
  }, [step, uploadedFile, raceName, participantName, distance, colorsLoading, sportFilaments, frameColor]);

  const goNext = () => {
    if (canGoNext && step < totalSteps - 1) setStep((p) => p + 1);
  };
  const goBack = () => {
    if (step > 0) setStep((p) => p - 1);
  };

  const handleAddToCart = () => {
    addItem({
      kind: "simple",
      title: "משושה מסלול",
      imageUrl: "/images/sport/map.jpeg",
      department: "sport",
      attributes: [
        `אירוע: ${raceName || "-"}`,
        `משתתף: ${participantName || "-"}`,
        `מרחק: ${distance || "-"} ק״מ`,
        wantsFrame ? "כולל מסגרת" : "ללא מסגרת",
        `צבע מסגרת: ${frameColor}`,
        uploadedFile ? `קובץ: ${uploadedFile.name}` : "ללא קובץ",
      ],
      quantity: 1,
      unitPrice: totalPrice,
      subtotal: totalPrice,
    });
    openCart();
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-black/10 focus:border-black";

  return (
    <div className="bg-white min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <aside className="lg:col-span-5 lg:sticky lg:top-6 h-fit">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">
            התאימו אישית — משושה מסלול
          </h1>
          <div className="mb-5 text-slate-500 text-sm font-medium">קוטר 12 ס״מ</div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white relative">
            <Image src="/images/sport/map.jpeg" alt="משושה מסלול" fill className="object-cover" />
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-sm text-slate-500">מחיר נוכחי</p>
            <p className="text-3xl font-extrabold text-slate-900">₪{totalPrice}</p>
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
                <div className="flex items-center gap-2 mb-3">
                  <UploadCloud size={20} strokeWidth={1.7} />
                  <h2 className="text-2xl font-bold text-slate-900">העלאת מסלול</h2>
                </div>
                <p className="text-slate-600 mb-5">
                  העלו קובץ GPX מ-Strava/Garmin, או צילום מסך של המסלול (PNG/JPEG).
                </p>
                <label className="block rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center bg-slate-50 hover:border-black transition-all cursor-pointer">
                  <input
                    type="file"
                    accept=".gpx,image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  />
                  <p className="font-medium text-slate-700">לחצו לבחירת קובץ GPX או תמונה</p>
                  <p className="text-xs text-slate-400 mt-1">GPX / PNG / JPEG</p>
                  {uploadedFile && (
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
                      <CheckCircle size={16} className="text-emerald-600" />
                      {uploadedFile.name}
                    </p>
                  )}
                </label>
              </div>
            )}

            {step === 1 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={20} strokeWidth={1.7} />
                  <h2 className="text-2xl font-bold text-slate-900">פרטי ההישג</h2>
                </div>
                <p className="text-slate-600 mb-5">התאימו את הפרטים שיופיעו במודל הסופי.</p>
                <div className="space-y-4">
                  <input
                    value={raceName}
                    onChange={(e) => setRaceName(e.target.value)}
                    className={inputCls}
                    placeholder="שם המירוץ / אירוע"
                  />
                  <input
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    className={inputCls}
                    placeholder="שם המשתתף"
                  />
                  <input
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className={inputCls}
                    placeholder="מרחק (ק״מ)"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Frame size={20} strokeWidth={1.7} />
                  <h2 className="text-2xl font-bold text-slate-900">בחירת צבע מסגרת</h2>
                </div>
                <p className="text-slate-600 mb-6">בחרו את צבע מסגרת התצוגה.</p>

                {colorsLoading ? (
                  <p className="text-sm text-slate-500">טוען צבעי ספורט…</p>
                ) : colorsError ? (
                  <p className="text-sm text-red-600">טעינת צבעים נכשלה: {colorsError}</p>
                ) : sportFilaments.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    אין כרגע צבעי ספורט זמינים במלאי. נסו שוב מאוחר יותר או פנו לתמיכה.
                  </p>
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

            {step === 3 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Frame size={20} strokeWidth={1.7} />
                  <h2 className="text-2xl font-bold text-slate-900">שדרוגים</h2>
                </div>
                <p className="text-slate-600 mb-5">בחרו תוספות למסלול המודפס שלכם.</p>
                <button
                  onClick={() => setWantsFrame((p) => !p)}
                  className={`w-full rounded-2xl border-2 p-5 text-right transition-all ${wantsFrame ? "border-black bg-black text-white" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <p className="font-bold text-lg">מסגרת תצוגה מעץ שחור (+₪50)</p>
                  <p className={`mt-1 text-sm ${wantsFrame ? "text-white/70" : "text-slate-500"}`}>
                    הופך את המודל לפריט תצוגה מושלם
                  </p>
                </button>
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Map size={20} strokeWidth={1.7} />
                  <h2 className="text-2xl font-bold text-slate-900">סיכום והוספה לסל</h2>
                </div>
                <p className="text-slate-600 mb-5">בדקו את הפרטים לפני ההוספה לסל.</p>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3 text-sm">
                  <Row label="קובץ" value={uploadedFile?.name || "-"} />
                  <Row label="אירוע" value={raceName || "-"} />
                  <Row label="משתתף" value={participantName || "-"} />
                  <Row label="מרחק" value={`${distance || "-"} ק״מ`} />
                  <Row label="מסגרת" value={wantsFrame ? "כולל מסגרת" : "ללא מסגרת"} />
                  <Row label="צבע מסגרת" value={frameColor} />
                  <div className="border-t border-slate-200 pt-3 flex justify-between gap-4">
                    <span className="font-bold text-slate-900">סה&quot;כ</span>
                    <span className="text-xl font-extrabold text-black">₪{totalPrice}</span>
                  </div>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={!frameColor}
                  className="mt-6 w-full rounded-2xl bg-black px-6 py-4 text-white font-bold text-lg hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  הוסף לסל — ₪{totalPrice}
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
