"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Check, ChevronDown, Plus, Minus, Search, Square, Type } from "lucide-react";
import { useCartStore } from "@/lib/store";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const PRODUCTS: Record<string, { name: string; basePrice: number; dims: string }> = {
  "cube": { name: "קובייה", basePrice: 199, dims: "15×15 ס״מ" },
  "cube-15": { name: "קובייה", basePrice: 199, dims: "15×15 ס״מ" },
  "minicube": { name: "מיני קובייה", basePrice: 159, dims: "10×10 ס״מ" },
  "mini-cube-10": { name: "מיני קובייה", basePrice: 159, dims: "10×10 ס״מ" },
  "rectangle": { name: "מלבן", basePrice: 199, dims: "17×12 ס״מ" },
  "rect-17": { name: "מלבן", basePrice: 199, dims: "17×12 ס״מ" },
};

const CITIES = [
  { name: "תל אביב", image: "/images/cities/tel-aviv.jpeg" },
  { name: "לונדון", image: "/images/cities/london.jpeg" },
  { name: "ניו יורק", image: "/images/cities/new-york.jpeg" },
  { name: "ירושלים", image: "/images/cities/city.jpeg" },
  { name: "ברצלונה", image: "/images/cities/city.jpeg" },
  { name: "פריז", image: "/images/cities/city.jpeg" },
  { name: "דובאי", image: "/images/cities/city.jpeg" },
  { name: "רומא", image: "/images/cities/city.jpeg" },
  { name: "מילאנו", image: "/images/cities/city.jpeg" },
  { name: "מיאמי", image: "/images/cities/city.jpeg" },
  { name: "לאס וגאס", image: "/images/cities/city.jpeg" },
  { name: "ונציה", image: "/images/cities/city.jpeg" },
  { name: "אבו דאבי", image: "/images/cities/city.jpeg" },
] as const;

type CoverType = "none" | "acrylic" | "glass";

const COVERS: { type: CoverType; label: string; price: number; desc: string }[] = [
  { type: "none", label: "ללא כיסוי", price: 0, desc: "המודל כפי שהוא" },
  { type: "acrylic", label: "כיסוי אקריליק", price: 149, desc: "שקוף, קליל ועמיד" },
  { type: "glass", label: "כיסוי זכוכית", price: 349, desc: "פרימיום, מראה יוקרתי" },
];

const STEP_LABELS = ["בחירת עיר", "הוספת כיסוי", "הוספת הקדשה"];

const DIMS_BY_ID: Record<string, string> = {
  cube: "15×15 ס״מ",
  "cube-15": "15×15 ס״מ",
  minicube: "10×10 ס״מ",
  "mini-cube-10": "10×10 ס״מ",
  rectangle: "17×12 ס״מ",
  "rect-17": "17×12 ס״מ",
};

const FAQ_ITEMS = (dims: string) => [
  {
    q: "מידות",
    a: `גודל המודל: ${dims}. המידות כוללות את הבסיס המודפס בלבד, ללא מסגרת או כיסוי.`,
  },
  {
    q: "משלוח",
    a: "זמן אספקה של עד 14 ימי עסקים. משלוח מבוטח עד הבית.",
  },
  {
    q: "אודות המודל",
    a: "מודל תלת-ממדי מדויק המיוצר בטכנולוגיית הדפסה מתקדמת. מבוסס על סריקות טופוגרפיות ונתוני לוויין.",
  },
  {
    q: "ניקוי ותחזוקה",
    a: "ניתן לנקות בקלות באמצעות משב רוח קל (מייבש שיער על קור). את המסגרת והכיסוי ניתן לנגב במטלית יבשה.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CitiesConfiguratorPage() {
  const { id } = useParams<{ id: string }>();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const product = PRODUCTS[id] ?? PRODUCTS["cube"];

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [coverType, setCoverType] = useState<CoverType>("none");
  const [wantsDedication, setWantsDedication] = useState(false);
  const [dedicationText, setDedicationText] = useState("");

  const handleToggleDedication = (val: boolean) => {
    setWantsDedication(val);
    if (!val) setDedicationText("");
  };

  const coverPrice = COVERS.find((c) => c.type === coverType)?.price ?? 0;
  const dedicationPrice = wantsDedication ? 50 : 0;
  const totalPrice = useMemo(
    () => product.basePrice + coverPrice + dedicationPrice,
    [product.basePrice, coverPrice, dedicationPrice],
  );

  const selectedCityImage =
    CITIES.find((c) => c.name === selectedCity)?.image ?? "/images/cities/city.jpeg";

  const canGoNext = currentStep === 0 ? Boolean(selectedCity) : true;

  const handleNext = () => {
    if (currentStep < 2 && canGoNext) setCurrentStep((s) => s + 1);
  };
  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleAddToCart = () => {
    const cover = COVERS.find((c) => c.type === coverType)!;
    addItem({
      kind: "simple",
      title: `מודלו סיטיז - ${product.name} (${selectedCity})`,
      imageUrl: selectedCity ? selectedCityImage : `/images/cities/${id}.png`,
      department: "cities",
      quantity: 1,
      unitPrice: totalPrice,
      subtotal: totalPrice,
      attributes: [
        `עיר: ${selectedCity}`,
        `גודל: ${product.dims}`,
        `כיסוי: ${cover.label}${cover.price ? ` (+₪${cover.price})` : ""}`,
        wantsDedication && dedicationText
          ? `הקדשה: ${dedicationText} (+₪50)`
          : "ללא הקדשה",
      ],
    });
    openCart();
  };

  const coverOverlayCls =
    coverType === "acrylic"
      ? "after:absolute after:inset-0 after:bg-white/20 after:backdrop-blur-[1px] after:rounded-2xl"
      : coverType === "glass"
        ? "after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/30 after:to-transparent after:rounded-2xl"
        : "";

  return (
    <div className="bg-white min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-12 gap-16">
        {/* ── Right: Sticky Preview (5 cols) ── */}
        <aside className="md:col-span-5 md:sticky md:top-6 h-fit">
          <div
            className={`relative aspect-square rounded-2xl border border-slate-200 bg-white flex items-center justify-center p-16 ${coverOverlayCls}`}
          >
            <div className={`relative ${id === 'minicube' ? 'w-3/4 h-3/4' : 'w-full h-full'}`}>
              <Image
                src={selectedCity ? selectedCityImage : `/images/cities/${id}.png`}
                alt={selectedCity ?? "בחרו עיר"}
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-sm text-slate-500">מודלו סיטיז - {product.name}</p>
              {selectedCity && (
                <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedCity}</p>
              )}
            </div>
            <p className="text-3xl font-extrabold text-black">₪{totalPrice}</p>
          </div>
        </aside>

        {/* ── Left: Configuration Panel (7 cols) ── */}
        <section className="md:col-span-7">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
            {product.name}
          </h1>
          <p className="text-slate-500 mb-10">
            בחרו עיר, כיסוי והקדשה — והמודל יגיע אליכם הביתה.
          </p>

          {/* Progress indicator */}
          <div className="flex items-center gap-1 mb-10">
            {STEP_LABELS.map((label, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={label} className="flex items-center gap-1 flex-1">
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={`w-full h-1.5 rounded-full transition-all ${
                        done ? "bg-black" : active ? "bg-black" : "bg-slate-200"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium whitespace-nowrap ${
                        done || active ? "text-black" : "text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panels */}
          {currentStep === 0 && (
            <PanelCity
              selectedCity={selectedCity}
              onSelect={setSelectedCity}
            />
          )}
          {currentStep === 1 && (
            <PanelCover coverType={coverType} onSelect={setCoverType} />
          )}
          {currentStep === 2 && (
            <PanelDedication
              wantsDedication={wantsDedication}
              onToggleDedication={handleToggleDedication}
              dedicationText={dedicationText}
              onChangeDedication={setDedicationText}
              product={product}
              selectedCity={selectedCity}
              coverType={coverType}
              totalPrice={totalPrice}
              onAddToCart={handleAddToCart}
            />
          )}

          {/* Navigation */}
          <div className="mt-10 flex items-center gap-4">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="rounded-2xl border-2 border-slate-300 px-8 py-4 text-base font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
              >
                אחורה
              </button>
            )}

            {currentStep < 2 && (
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex-1 rounded-2xl bg-black px-8 py-4 text-base font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-all"
              >
                הבא
              </button>
            )}
          </div>
        </section>
      </div>

      {/* ── More Information Accordion ── */}
      <div className="max-w-4xl mx-auto mt-24 mb-24 px-6">
        <h2 className="text-2xl font-bold mb-8">מידע נוסף</h2>
        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
          {FAQ_ITEMS(DIMS_BY_ID[id] ?? "15×15 ס״מ").map((item) => (
            <AccordionItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PanelCity — Searchable dropdown                                    */
/* ------------------------------------------------------------------ */

function PanelCity({
  selectedCity,
  onSelect,
}: {
  selectedCity: string | null;
  onSelect: (city: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => CITIES.filter((c) => c.name.includes(query)),
    [query],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">בחרו את העיר שתופיע במודל שלכם</h2>
      <p className="text-sm text-slate-500 mb-6">
        חפשו מתוך הרשימה או גללו למציאת העיר הרצויה
      </p>

      <div ref={containerRef} className="relative">
        {/* Trigger / Search input */}
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className={`w-full flex items-center justify-between rounded-xl border px-4 py-4 text-right transition-all ${
            open
              ? "border-black ring-2 ring-black/10"
              : "border-gray-200 hover:border-gray-400"
          }`}
        >
          <span className={selectedCity ? "text-slate-900 font-medium" : "text-slate-400"}>
            {selectedCity ?? "בחרו עיר..."}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={1.8}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-30 top-full mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
            {/* Search field */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <Search className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.8} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש עיר..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Options list */}
            <ul className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-slate-400 text-center">
                  לא נמצאו תוצאות
                </li>
              )}
              {filtered.map((city) => {
                const isSelected = selectedCity === city.name;
                return (
                  <li key={city.name}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(city.name);
                        setQuery("");
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                        isSelected
                          ? "bg-slate-100 font-semibold text-black"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{city.name}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-black" strokeWidth={2.5} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PanelCover                                                         */
/* ------------------------------------------------------------------ */

function PanelCover({
  coverType,
  onSelect,
}: {
  coverType: CoverType;
  onSelect: (t: CoverType) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">הגנו על המודל עם כיסוי פרימיום</h2>
      <p className="text-sm text-slate-500 mb-6">בחרו סוג כיסוי או המשיכו בלי</p>

      <div className="space-y-4">
        {COVERS.map((cover) => {
          const isActive = coverType === cover.type;
          return (
            <button
              key={cover.type}
              onClick={() => onSelect(cover.type)}
              className={`w-full rounded-2xl border-2 p-6 text-right transition-all flex items-center gap-5 ${
                isActive
                  ? "border-black bg-black text-white"
                  : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
              }`}
            >
              <div
                className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                  isActive ? "bg-white/20" : "bg-slate-100"
                }`}
              >
                <Square
                  className={`w-6 h-6 ${isActive ? "text-white" : "text-slate-500"}`}
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">{cover.label}</p>
                <p className={`text-sm mt-0.5 ${isActive ? "text-white/75" : "text-slate-500"}`}>
                  {cover.desc}
                </p>
              </div>
              <p className="text-lg font-extrabold shrink-0">
                {cover.price === 0 ? "ללא תוספת תשלום" : `+₪${cover.price}`}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PanelDedication                                                    */
/* ------------------------------------------------------------------ */

function PanelDedication({
  wantsDedication,
  onToggleDedication,
  dedicationText,
  onChangeDedication,
  product,
  selectedCity,
  coverType,
  totalPrice,
  onAddToCart,
}: {
  wantsDedication: boolean;
  onToggleDedication: (v: boolean) => void;
  dedicationText: string;
  onChangeDedication: (v: string) => void;
  product: { name: string; dims: string };
  selectedCity: string | null;
  coverType: CoverType;
  totalPrice: number;
  onAddToCart: () => void;
}) {
  const cover = COVERS.find((c) => c.type === coverType)!;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">
        הוסיפו הקדשה אישית למודל
      </h2>
      <p className="text-sm text-slate-500 mb-6">טקסט שייחרט בחזית המודל (אופציונלי)</p>

      {/* Toggle cards */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onToggleDedication(false)}
          className={`rounded-2xl border-2 p-5 text-center transition-all ${
            !wantsDedication
              ? "border-black bg-black text-white"
              : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
          }`}
        >
          <p className="font-bold text-base">ללא הקדשה</p>
          <p className={`text-sm mt-1 ${!wantsDedication ? "text-white/75" : "text-slate-500"}`}>
            ללא תוספת תשלום
          </p>
        </button>

        <button
          type="button"
          onClick={() => onToggleDedication(true)}
          className={`rounded-2xl border-2 p-5 text-center transition-all ${
            wantsDedication
              ? "border-black bg-black text-white"
              : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
          }`}
        >
          <p className="font-bold text-base">הוספת הקדשה אישית</p>
          <p className={`text-sm mt-1 ${wantsDedication ? "text-white/75" : "text-slate-500"}`}>
            +₪50
          </p>
        </button>
      </div>

      {/* Conditional text input */}
      {wantsDedication && (
        <div className="mt-6">
          <div className="relative">
            <Type
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              strokeWidth={1.5}
            />
            <input
              type="text"
              maxLength={20}
              value={dedicationText}
              onChange={(e) => onChangeDedication(e.target.value)}
              placeholder="לדוגמה: ״לאמא באהבה״"
              className="w-full rounded-xl border border-slate-300 pr-12 pl-4 py-4 text-lg outline-none transition-all focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-slate-500">עד 20 תווים. ההקדשה תודפס בחזית המודל.</p>
            <p className="text-xs text-slate-400 shrink-0" dir="ltr">
              {dedicationText.length}/20
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-3 text-sm">
        <SummaryRow label="מוצר" value={`מודלו סיטיז - ${product.name}`} />
        <SummaryRow label="גודל" value={product.dims} />
        <SummaryRow label="עיר" value={selectedCity ?? "-"} />
        <SummaryRow label="כיסוי" value={cover.label} />
        <SummaryRow
          label="הקדשה"
          value={wantsDedication ? (dedicationText || "—") + " (+₪50)" : "ללא"}
        />
        <div className="border-t border-slate-200 pt-3 flex justify-between">
          <span className="font-bold text-slate-900">סה״כ</span>
          <span className="font-extrabold text-xl text-black">₪{totalPrice}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onAddToCart}
        disabled={!selectedCity}
        className="mt-8 w-full rounded-2xl bg-black px-6 py-5 text-white font-bold text-lg hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        הוסף לסל — ₪{totalPrice}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AccordionItem                                                      */
/* ------------------------------------------------------------------ */

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <details
      className="group"
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="flex items-center justify-between cursor-pointer py-5 px-1 select-none">
        <span className="font-semibold text-slate-900">{question}</span>
        {open ? (
          <Minus className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.8} />
        ) : (
          <Plus className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.8} />
        )}
      </summary>
      <div className="pb-5 px-1 text-sm text-slate-600 leading-relaxed">{answer}</div>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared                                                             */
/* ------------------------------------------------------------------ */

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
