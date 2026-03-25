"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/store";

type ModelType = "person" | "animal";

interface WizardState {
  modelType: ModelType | null;
  uploadedPhoto: string | null;
  eyeColor: string;
  skinColor: string;
  customPreferences: string;
  baseColor: string;
  dedicationText: string;
}

const EYE_COLORS = [
  { label: "חום", hex: "#654321" },
  { label: "ירוק", hex: "#4CAF50" },
  { label: "כחול", hex: "#2196F3" },
] as const;

const SKIN_COLORS = [
  { label: "בהיר", hex: "#FFDFC4" },
  { label: "בינוני", hex: "#D09B76" },
  { label: "כהה", hex: "#4A2E1B" },
] as const;

const BASE_COLORS = ["שחור", "בז׳", "לבן"] as const;

const INITIAL: WizardState = {
  modelType: null,
  uploadedPhoto: null,
  eyeColor: "",
  skinColor: "",
  customPreferences: "",
  baseColor: "",
  dedicationText: "",
};

export default function PersonalWizardPage() {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const [ws, setWs] = useState<WizardState>(INITIAL);
  const [step, setStep] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoUrlRef = useRef<string | null>(null);

  const steps = useMemo(() => {
    const s: string[] = ["modelType", "uploadPhoto"];
    if (ws.modelType === "person") s.push("characteristics");
    s.push("baseDedication", "summary");
    return s;
  }, [ws.modelType]);

  const currentStep = steps[step];
  const totalSteps = steps.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;

  const basePrice = useMemo(() => {
    if (ws.modelType === "animal") return 199;
    if (ws.modelType === "person") return 289;
    return 0;
  }, [ws.modelType]);

  const dedicationAddon = ws.dedicationText.trim().length > 0 ? 50 : 0;
  const totalPrice = basePrice + dedicationAddon;

  const canGoNext = useMemo(() => {
    if (currentStep === "modelType") return ws.modelType !== null;
    if (currentStep === "uploadPhoto") return ws.uploadedPhoto !== null;
    if (currentStep === "characteristics") return ws.eyeColor.length > 0 && ws.skinColor.length > 0;
    if (currentStep === "baseDedication") return ws.baseColor.length > 0;
    return false;
  }, [currentStep, ws]);

  const update = <K extends keyof WizardState>(key: K, val: WizardState[K]) =>
    setWs((p) => ({ ...p, [key]: val }));

  const selectModel = (t: ModelType) => {
    setWs((p) => ({
      ...p,
      modelType: t,
      eyeColor: t === "person" ? p.eyeColor : "",
      skinColor: t === "person" ? p.skinColor : "",
      customPreferences: t === "person" ? p.customPreferences : "",
    }));
  };

  const setPhoto = (file: File) => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    const url = URL.createObjectURL(file);
    photoUrlRef.current = url;
    update("uploadedPhoto", url);
  };

  const resetPhoto = () => {
    if (photoUrlRef.current) { URL.revokeObjectURL(photoUrlRef.current); photoUrlRef.current = null; }
    update("uploadedPhoto", null);
    if (fileRef.current) fileRef.current.value = "";
  };

  useEffect(() => () => { if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current); }, []);

  const goNext = () => { if (canGoNext && !isLast) setStep((p) => p + 1); };
  const goBack = () => { if (!isFirst) setStep((p) => p - 1); };

  const handleAddToCart = () => {
    const label = ws.modelType === "person" ? "בן אדם" : "בעל חיים";
    addItem({
      kind: "simple",
      title: `מודלו פרסונל — ${label}`,
      imageUrl: ws.uploadedPhoto || "/images/logo/logo-personal.jpeg",
      department: "personal",
      attributes: [
        `סוג מודל: ${label}`,
        `צבע בסיס: ${ws.baseColor || "-"}`,
        `הקדשה: ${ws.dedicationText || "ללא"}`,
        ...(ws.modelType === "person"
          ? [`צבע עיניים: ${ws.eyeColor}`, `צבע עור: ${ws.skinColor}`]
          : []),
        ...(ws.customPreferences ? [`העדפות: ${ws.customPreferences}`] : []),
      ],
      quantity: 1,
      unitPrice: totalPrice || 199,
      subtotal: totalPrice || 199,
    });
    openCart();
  };

  const cardCls = (active: boolean) =>
    active
      ? "border-black bg-black text-white shadow-lg"
      : "border-slate-200 bg-white hover:border-slate-300";

  return (
    <div className="bg-white min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* ── Right: Sticky Preview ── */}
        <aside className="lg:col-span-5 lg:sticky lg:top-6 h-fit">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">מודלו פרסונל</h1>

          <div className="aspect-square rounded-2xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden relative">
            {ws.uploadedPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ws.uploadedPhoto} alt="תצוגה מקדימה" className="h-full w-full object-contain" />
            ) : (
              <div className="text-center text-slate-400 px-6">
                <p className="text-5xl mb-3">📷</p>
                <p className="text-sm">התמונה שתעלו תוצג כאן</p>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-sm text-slate-500">מחיר נוכחי</p>
            <p className="text-3xl font-extrabold text-slate-900">₪{totalPrice || "—"}</p>
          </div>
        </aside>

        {/* ── Left: Wizard Panel ── */}
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

            {/* ─ Step: Model Type ─ */}
            {currentStep === "modelType" && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">בחרו סוג מודל</h2>
                <p className="text-slate-600 mb-6">מה תרצו שניצור עבורכם?</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button onClick={() => selectModel("person")} className={`rounded-2xl border-2 p-6 text-right transition-all ${cardCls(ws.modelType === "person")}`}>
                    <div className="text-3xl mb-3">👤</div>
                    <p className="text-lg font-bold">בן אדם</p>
                    <p className={`text-sm mt-1 ${ws.modelType === "person" ? "text-white/70" : "text-slate-500"}`}>דמות אישית על בסיס תמונה</p>
                    <p className={`text-sm font-bold mt-3 ${ws.modelType === "person" ? "text-white" : "text-slate-900"}`}>החל מ-₪289</p>
                  </button>
                  <button onClick={() => selectModel("animal")} className={`rounded-2xl border-2 p-6 text-right transition-all ${cardCls(ws.modelType === "animal")}`}>
                    <div className="text-3xl mb-3">🐾</div>
                    <p className="text-lg font-bold">בעל חיים</p>
                    <p className={`text-sm mt-1 ${ws.modelType === "animal" ? "text-white/70" : "text-slate-500"}`}>מודל מותאם של חיית מחמד</p>
                    <p className={`text-sm font-bold mt-3 ${ws.modelType === "animal" ? "text-white" : "text-slate-900"}`}>₪199</p>
                  </button>
                </div>
              </div>
            )}

            {/* ─ Step: Upload Photo ─ */}
            {currentStep === "uploadPhoto" && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">העלאת תמונות</h2>
                <p className="text-slate-600 mb-6">העלו תמונה ברורה כדי שנוכל להתחיל בעיצוב.</p>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) setPhoto(f); }}
                  className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all ${isDragOver ? "border-black bg-slate-100" : "border-slate-300 bg-white"}`}
                >
                  <input ref={fileRef} id="photo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(f); }} />

                  {ws.uploadedPhoto ? (
                    <div className="space-y-4">
                      <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold">✓</div>
                      <p className="font-semibold text-emerald-700">התמונה הועלתה בהצלחה</p>
                      <div className="mx-auto h-36 w-28 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ws.uploadedPhoto} alt="preview" className="h-full w-full object-contain" />
                      </div>
                      <button onClick={resetPhoto} className="text-sm text-slate-600 hover:text-black underline underline-offset-2">העלאה מחדש</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-5xl">📷</div>
                      <p className="text-slate-700 font-semibold">גררו לכאן תמונה או לחצו לבחירה</p>
                      <label htmlFor="photo-upload" className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-black px-6 py-3 text-white text-sm font-bold hover:bg-slate-800 transition-colors">
                        בחירת תמונה
                      </label>
                      <p className="text-xs text-slate-500">PNG / JPG / JPEG</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─ Step: Characteristics (person only) ─ */}
            {currentStep === "characteristics" && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">פרטים נוספים</h2>
                <p className="text-slate-600 mb-6">פרטים שיעזרו לנו להתאים את המודל בדיוק.</p>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-3">צבע עיניים</p>
                    <div className="grid grid-cols-3 gap-3">
                      {EYE_COLORS.map((c) => (
                        <button
                          key={c.label}
                          onClick={() => update("eyeColor", c.label)}
                          className={`rounded-xl border-2 px-4 py-3 flex items-center gap-2.5 transition-all ${ws.eyeColor === c.label ? "border-black bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}
                        >
                          <span className={`w-6 h-6 rounded-full border shadow-sm ${ws.eyeColor === c.label ? "ring-2 ring-black ring-offset-1" : "border-slate-300"}`} style={{ backgroundColor: c.hex }} />
                          <span className="text-sm font-medium">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-3">צבע עור</p>
                    <div className="grid grid-cols-3 gap-3">
                      {SKIN_COLORS.map((c) => (
                        <button
                          key={c.label}
                          onClick={() => update("skinColor", c.label)}
                          className={`rounded-xl border-2 px-4 py-3 flex items-center gap-2.5 transition-all ${ws.skinColor === c.label ? "border-black bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}
                        >
                          <span className={`w-6 h-6 rounded-full border shadow-sm ${ws.skinColor === c.label ? "ring-2 ring-black ring-offset-1" : "border-slate-300"}`} style={{ backgroundColor: c.hex }} />
                          <span className="text-sm font-medium">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      העדפות אישיות (תסרוקת, לבוש, חזות ייחודית)
                    </label>
                    <textarea
                      rows={3}
                      value={ws.customPreferences}
                      onChange={(e) => update("customPreferences", e.target.value)}
                      placeholder="לדוגמה: שיער קצר, חולצה כחולה, משקפיים..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─ Step: Base & Dedication ─ */}
            {currentStep === "baseDedication" && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">בסיס והקדשה</h2>
                <p className="text-slate-600 mb-6">בחרו צבע מעמד והוסיפו הקדשה אישית.</p>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-3">צבע מעמד</p>
                    <div className="flex flex-wrap gap-3">
                      {BASE_COLORS.map((color) => {
                        const bg = color === "שחור" ? "bg-black" : color === "בז׳" ? "bg-[#dfccb4]" : "bg-white";
                        return (
                          <button
                            key={color}
                            onClick={() => update("baseColor", color)}
                            className={`rounded-xl border-2 px-4 py-3 text-sm font-medium flex items-center gap-2 transition-all ${ws.baseColor === color ? "border-black bg-black text-white" : "border-slate-200 hover:border-slate-300"}`}
                          >
                            <span className={`h-4 w-4 rounded-full border ${bg} ${color === "לבן" ? "border-slate-300" : "border-transparent"}`} />
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      הקדשה אישית
                      <span className="text-xs text-slate-500 font-medium mr-2">(+₪50)</span>
                    </label>
                    <input
                      type="text"
                      value={ws.dedicationText}
                      onChange={(e) => update("dedicationText", e.target.value.slice(0, 13))}
                      maxLength={13}
                      placeholder="עד 13 תווים (אופציונלי)"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>ההקדשה אופציונלית.</span>
                      <span dir="ltr">{ws.dedicationText.length}/13</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─ Step: Summary ─ */}
            {currentStep === "summary" && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">סיכום והוספה לסל</h2>
                <p className="text-slate-600 mb-6">בדקו את הפרטים לפני ההוספה לסל.</p>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3 text-sm">
                  <Row label="סוג מודל" value={ws.modelType === "person" ? "בן אדם" : "בעל חיים"} />
                  <Row label="תמונה" value={ws.uploadedPhoto ? "הועלתה בהצלחה" : "לא הועלתה"} />
                  {ws.modelType === "person" && (
                    <>
                      <Row label="צבע עיניים" value={ws.eyeColor || "-"} />
                      <Row label="צבע עור" value={ws.skinColor || "-"} />
                    </>
                  )}
                  <Row label="צבע בסיס" value={ws.baseColor || "-"} />
                  <Row label="הקדשה" value={ws.dedicationText || "ללא"} />
                  {ws.customPreferences && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-slate-500 mb-1">העדפות אישיות</p>
                      <p className="text-slate-800">{ws.customPreferences}</p>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-3 space-y-2">
                    <Row label="מחיר בסיס" value={`₪${basePrice}`} />
                    {dedicationAddon > 0 && <Row label="הקדשה אישית" value={`+₪${dedicationAddon}`} />}
                    <div className="flex justify-between gap-4 pt-1">
                      <span className="font-bold text-slate-900">סה&quot;כ</span>
                      <span className="text-xl font-extrabold text-black">₪{totalPrice}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="mt-6 w-full rounded-2xl bg-black px-6 py-4 text-white font-bold text-lg hover:bg-slate-800 transition-all"
                >
                  הוסף לסל — ₪{totalPrice}
                </button>
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-4">
              {!isFirst && (
                <button
                  onClick={goBack}
                  className="rounded-2xl border-2 border-slate-300 px-8 py-4 text-base font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  אחורה
                </button>
              )}

              {!isLast && (
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
