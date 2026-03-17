"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Frame, Map, Trophy, UploadCloud } from "lucide-react";
import { useCart } from "@/context/CartContext";

const BASE_PRICE = 199;
const FRAME_ADDON = 50;

export default function SportPage() {
  const router = useRouter();
  const { addToCart } = useCart();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [raceName, setRaceName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [distance, setDistance] = useState("");
  const [wantsFrame, setWantsFrame] = useState(false);

  const totalPrice = useMemo(() => BASE_PRICE + (wantsFrame ? FRAME_ADDON : 0), [wantsFrame]);

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(gpxFile);
    if (step === 2) return Boolean(raceName.trim() && participantName.trim() && distance.trim());
    return true;
  }, [step, gpxFile, raceName, participantName, distance]);

  const goNext = () => {
    if (!canContinue || step === 4) return;
    setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
  };

  const goBack = () => {
    if (step === 1) return;
    setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
  };

  const handleAddToCart = () => {
    addToCart({
      id: `sport-${Date.now()}`,
      name: "מודלו ספורט - מסלול תלת מימד",
      price: totalPrice,
      quantity: 1,
      image: "/images/sport-sample.jpeg",
      department: "sport",
      attributes: [
        `אירוע: ${raceName || "-"}`,
        `משתתף: ${participantName || "-"}`,
        `מרחק: ${distance || "-"} ק״מ`,
        wantsFrame ? "כולל מסגרת עץ שחורה" : "ללא מסגרת",
        gpxFile ? `קובץ: ${gpxFile.name}` : "ללא קובץ",
      ],
    });
    router.push("/cart");
  };

  const inputCls =
    "w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-black";

  return (
    <div className="bg-white min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <aside className="lg:col-span-5 lg:sticky lg:top-6 h-fit">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">
            מודלו ספורט - המסלול שלך בתלת מימד
          </h1>
          <div className="aspect-square overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white relative">
            <Image
              src="/images/sport-sample.jpeg"
              alt="Sport sample"
              fill
              className="object-cover"
            />
          </div>
          <div className="mt-5 rounded-xl border border-gray-200 p-4 bg-gray-50">
            <p className="text-sm text-gray-600">מחיר נוכחי</p>
            <p className="text-3xl font-extrabold text-slate-900">₪{totalPrice}</p>
          </div>
        </aside>

        <section className="lg:col-span-7">
          <div className="rounded-2xl border border-gray-200 p-5 md:p-7">
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>שלב {step} מתוך 4</span>
                <span>{Math.round((step / 4) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {step === 1 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UploadCloud size={20} strokeWidth={1.7} />
                  <h2 className="text-2xl font-bold text-slate-900">העלאת מסלול</h2>
                </div>
                <p className="text-slate-600 mb-5">העלו קובץ GPX מאפליקציית Strava או Garmin</p>
                <label className="block rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50 hover:border-black transition-all cursor-pointer">
                  <input
                    type="file"
                    accept=".gpx"
                    className="hidden"
                    onChange={(event) => setGpxFile(event.target.files?.[0] || null)}
                  />
                  <p className="font-medium text-gray-700">לחצו לבחירת קובץ GPX</p>
                  {gpxFile && (
                    <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1 text-sm text-gray-700">
                      <CheckCircle size={16} />
                      {gpxFile.name}
                    </p>
                  )}
                </label>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={20} strokeWidth={1.7} />
                  <h2 className="text-2xl font-bold text-slate-900">פרטי ההישג</h2>
                </div>
                <p className="text-slate-600 mb-5">התאימו את הפרטים שיופיעו במודל הסופי</p>
                <div className="space-y-4">
                  <input
                    value={raceName}
                    onChange={(event) => setRaceName(event.target.value)}
                    className={inputCls}
                    placeholder="שם המירוץ / אירוע"
                  />
                  <input
                    value={participantName}
                    onChange={(event) => setParticipantName(event.target.value)}
                    className={inputCls}
                    placeholder="שם המשתתף"
                  />
                  <input
                    value={distance}
                    onChange={(event) => setDistance(event.target.value)}
                    className={inputCls}
                    placeholder="מרחק (ק״מ)"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Frame size={20} strokeWidth={1.7} />
                  <h2 className="text-2xl font-bold text-slate-900">שדרוגים</h2>
                </div>
                <p className="text-slate-600 mb-5">בחרו תוספות למסלול המודפס שלכם</p>
                <button
                  onClick={() => setWantsFrame((prev) => !prev)}
                  className={`w-full rounded-2xl border p-5 text-right transition-all ${
                    wantsFrame
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white hover:border-black"
                  }`}
                >
                  <p className="font-bold text-lg">מסגרת תצוגה מעץ שחור (+₪50)</p>
                  <p className={`mt-1 text-sm ${wantsFrame ? "text-white/80" : "text-gray-500"}`}>
                    הופך את המודל לפריט תצוגה מושלם לבית או למשרד
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
                <p className="text-slate-600 mb-5">בדקו את הפרטים לפני ההוספה לסל</p>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">קובץ GPX</span>
                    <span className="font-semibold text-gray-900">{gpxFile?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">אירוע</span>
                    <span className="font-semibold text-gray-900">{raceName || "-"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">משתתף</span>
                    <span className="font-semibold text-gray-900">{participantName || "-"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">מרחק</span>
                    <span className="font-semibold text-gray-900">{distance || "-"} ק״מ</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">מסגרת</span>
                    <span className="font-semibold text-gray-900">
                      {wantsFrame ? "כולל מסגרת" : "ללא מסגרת"}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between gap-4">
                    <span className="font-bold text-gray-900">סה״כ</span>
                    <span className="font-extrabold text-xl text-black">₪{totalPrice}</span>
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

            <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={goBack}
                disabled={step === 1}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                חזור
              </button>

              {step < 4 ? (
                <button
                  onClick={goNext}
                  disabled={!canContinue}
                  className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-all"
                >
                  המשך
                </button>
              ) : (
                <div className="w-[72px]" />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
