"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Check, ChevronDown, Plus, Minus, Search, X } from "lucide-react";
import { getCities, type CityDoc, type CitySizeKey } from "@/lib/firebase/cities";
import { useCartStore } from "@/lib/store";
import type { CartItem } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const PRODUCTS: Record<string, { name: string; basePrice: number; dims: string }> = {
  cube: { name: "קובייה", basePrice: 199, dims: "15×15 ס״מ" },
  minicube: { name: "מיני קובייה", basePrice: 159, dims: "10×10 ס״מ" },
};

function basePriceForCity(city: CityDoc | null, sizeKey: CitySizeKey): number {
  const fallback = PRODUCTS[sizeKey].basePrice;
  if (!city) return fallback;
  if (sizeKey === "minicube") return city.priceMinicube ?? fallback;
  return city.priceCube ?? fallback;
}

/** ₪ off for each city after the first (bundle pricing). */
const BUNDLE_DISCOUNT_PER_EXTRA_CITY = 20;

function sumLinePrices(cities: CityDoc[], sizeKey: CitySizeKey): number {
  return cities.reduce((sum, c) => sum + basePriceForCity(c, sizeKey), 0);
}

function bundlePriceAfterDiscount(cities: CityDoc[], sizeKey: CitySizeKey): number {
  const n = cities.length;
  if (n === 0) return 0;
  return sumLinePrices(cities, sizeKey) - (n - 1) * BUNDLE_DISCOUNT_PER_EXTRA_CITY;
}

const FRAME_COLORS = [
  { name: "שחור", swatchCls: "bg-black" },
  { name: "לבן", swatchCls: "bg-white border border-gray-200" },
] as const;

const COVER_PRICE = 150;

const STEP_LABELS = ["בחירת ערים", "צבע מסגרת", "כיסוי תצוגה", "סיכום"];
const TOTAL_STEPS = STEP_LABELS.length;

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

type CitySlot = { cityId: string | null };

/* ------------------------------------------------------------------ */
/*  Previews                                                           */
/* ------------------------------------------------------------------ */

function CityPreviewImage({
  imageUrl,
  alt,
  subtitle,
  isMinicube,
  hasCover,
}: {
  imageUrl: string;
  alt: string;
  subtitle: string;
  isMinicube: boolean;
  hasCover: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="w-full aspect-square bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-2 rounded-sm p-4 text-center">
        <span className="text-xs text-slate-400">תמונה חסרה</span>
        <span className="text-lg font-light text-slate-500">{subtitle}</span>
      </div>
    );
  }

  return (
    <>
      <div className={`relative w-full h-full ${isMinicube ? "p-16" : "p-10"}`}>
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-contain"
          onError={() => setImgError(true)}
        />
      </div>
      {hasCover && (
        <div className="absolute inset-4 border-[3px] border-white/40 bg-gradient-to-b from-white/15 to-transparent backdrop-blur-[1px] pointer-events-none rounded-xl" />
      )}
    </>
  );
}

function BundleCellPreview({
  imageUrl,
  name,
  isMinicube,
  hasCover,
}: {
  imageUrl?: string;
  name: string;
  isMinicube: boolean;
  hasCover: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  if (!imageUrl || imgError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-100 p-2 text-center">
        <span className="text-[10px] text-slate-400">תמונה חסרה</span>
        <span className="text-xs font-medium leading-tight text-slate-600 line-clamp-2">{name}</span>
      </div>
    );
  }

  return (
    <>
      <div className={`relative h-full w-full ${isMinicube ? "p-6" : "p-4"}`}>
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-contain"
          onError={() => setImgError(true)}
        />
      </div>
      {hasCover && (
        <div className="pointer-events-none absolute inset-1 rounded-lg border-2 border-white/35 bg-gradient-to-b from-white/10 to-transparent" />
      )}
    </>
  );
}

function BundlePreviewGrid({
  cities,
  sizeKey,
  hasCover,
  isMinicube,
}: {
  cities: CityDoc[];
  sizeKey: CitySizeKey;
  hasCover: boolean;
  isMinicube: boolean;
}) {
  const n = cities.length;
  if (n === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <span className="text-lg font-light text-slate-400">בחרו ערים</span>
      </div>
    );
  }

  if (n === 1) {
    const c = cities[0];
    const url = c.images?.[sizeKey];
    return (
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {!url ? (
          <div className="flex aspect-square w-full items-center justify-center bg-slate-50">
            <span className="text-3xl font-light text-slate-400">{c.name}</span>
          </div>
        ) : (
          <CityPreviewImage
            key={url}
            imageUrl={url}
            alt={c.name}
            subtitle={c.name}
            isMinicube={isMinicube}
            hasCover={hasCover}
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-2">
      {cities.map((c) => {
        const url = c.images?.[sizeKey];
        return (
          <div
            key={c.id}
            className="relative aspect-square overflow-hidden rounded-xl border border-slate-100 bg-slate-50"
          >
            <BundleCellPreview imageUrl={url} name={c.name} isMinicube={isMinicube} hasCover={hasCover} />
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CitiesConfiguratorPage() {
  const { id } = useParams<{ id: string }>();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const sizeKey: CitySizeKey = id === "minicube" ? "minicube" : "cube";
  const product = PRODUCTS[sizeKey];

  const [step, setStep] = useState(0);
  const [citySlots, setCitySlots] = useState<CitySlot[]>([{ cityId: null }]);
  const [frameColor, setFrameColor] = useState("שחור");
  const [hasCover, setHasCover] = useState(false);
  const [cities, setCities] = useState<CityDoc[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  const resolvedCityDocs = useMemo(() => {
    return citySlots
      .map((s) => (s.cityId ? cities.find((c) => c.id === s.cityId) ?? null : null))
      .filter((c): c is CityDoc => c !== null);
  }, [citySlots, cities]);

  const selectedCitiesPayload = useMemo(
    () =>
      resolvedCityDocs.map((c) => ({
        name: c.name,
        slug: c.slug,
        imageUrl: c.images?.[sizeKey],
      })),
    [resolvedCityDocs, sizeKey],
  );

  useEffect(() => {
    let isActive = true;

    async function loadCities() {
      try {
        setIsLoadingCities(true);
        setCitiesError(null);
        const docs = await getCities();
        if (!isActive) return;
        setCities(docs);
      } catch (error) {
        if (!isActive) return;
        const message =
          error instanceof Error ? error.message : "Unknown cities fetch error";
        console.error("[Cities Wizard] Failed loading cities:", message);
        setCitiesError("טעינת הערים נכשלה. נסו לרענן את העמוד.");
      } finally {
        if (isActive) setIsLoadingCities(false);
      }
    }

    loadCities();
    return () => {
      isActive = false;
    };
  }, []);

  const lineBeforeDiscount = useMemo(
    () => sumLinePrices(resolvedCityDocs, sizeKey),
    [resolvedCityDocs, sizeKey],
  );

  const lineAfterBundleDiscount = useMemo(
    () => bundlePriceAfterDiscount(resolvedCityDocs, sizeKey),
    [resolvedCityDocs, sizeKey],
  );

  const totalPrice = useMemo(
    () => lineAfterBundleDiscount + (hasCover ? COVER_PRICE : 0),
    [lineAfterBundleDiscount, hasCover],
  );

  const originalTotalWithCover = useMemo(
    () => lineBeforeDiscount + (hasCover ? COVER_PRICE : 0),
    [lineBeforeDiscount, hasCover],
  );

  const showBundleStrike = resolvedCityDocs.length > 1;

  const canGoNext = useMemo(() => {
    if (step === 0) {
      const allFilled = citySlots.length > 0 && citySlots.every((s) => s.cityId !== null);
      return allFilled && !isLoadingCities;
    }
    return true;
  }, [step, citySlots, isLoadingCities]);

  const goNext = () => {
    if (canGoNext && step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  };
  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  function updateSlot(index: number, cityId: string) {
    setCitySlots((prev) => prev.map((s, i) => (i === index ? { cityId } : s)));
  }

  function removeSlot(index: number) {
    setCitySlots((prev) => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return [{ cityId: null }];
    });
  }

  function addEmptySlot() {
    setCitySlots((prev) => [...prev, { cityId: null }]);
  }

  const handleAddToCart = () => {
    const n = selectedCitiesPayload.length;
    if (n === 0) return;

    const attrs: string[] = [
      `ערים (${n}): ${selectedCitiesPayload.map((c) => c.name).join(", ")}`,
      `גודל: ${product.dims}`,
      `צבע מסגרת: ${frameColor}`,
      hasCover ? `כיסוי אקרילי (+₪${COVER_PRICE})` : "ללא כיסוי",
    ];
    if (n > 1) {
      attrs.push(`הנחת חבילה: −₪${(n - 1) * BUNDLE_DISCOUNT_PER_EXTRA_CITY}`);
    }

    addItem({
      kind: "cities_bundle",
      title: `מודלו סיטיז — ${product.name} · ${n} ערים`,
      imageUrl: selectedCitiesPayload[0]?.imageUrl,
      department: "cities",
      productName: product.name,
      sizeKey: sizeKey === "minicube" ? "minicube" : "cube",
      sizeLabel: product.dims,
      frameColor,
      hasCover,
      coverPrice: COVER_PRICE,
      bundleDiscountPerExtraCity: BUNDLE_DISCOUNT_PER_EXTRA_CITY,
      cities: selectedCitiesPayload.map(({ name, slug, imageUrl }) => ({ name, slug, imageUrl })),
      quantity: 1,
      unitPrice: totalPrice,
      subtotal: totalPrice,
      attributes: attrs,
    } as Omit<CartItem, "id" | "addedAt">);
    openCart();
  };

  const previewNames =
    resolvedCityDocs.length > 0
      ? resolvedCityDocs.map((c) => c.name).join(" · ")
      : product.name;

  return (
    <div className="bg-white min-h-screen" dir="rtl">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-10 md:grid-cols-12">
        {/* ── Right: Sticky Preview ── */}
        <aside className="md:col-span-5 md:sticky md:top-6 md:h-fit">
          <BundlePreviewGrid
            cities={resolvedCityDocs}
            sizeKey={sizeKey}
            hasCover={hasCover}
            isMinicube={id === "minicube"}
          />

          <div className="mt-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">מודלו סיטיז - {product.name}</p>
              <p className="text-xs text-slate-400">{product.dims}</p>
              {resolvedCityDocs.length > 0 && (
                <p className="mt-0.5 line-clamp-2 text-lg font-bold text-slate-900">{previewNames}</p>
              )}
            </div>
            <div className="shrink-0 text-left" dir="ltr">
              {showBundleStrike ? (
                <div className="flex flex-col items-end gap-0.5">
                  <p className="text-3xl font-extrabold text-black tabular-nums">₪{totalPrice}</p>
                  <p className="text-lg text-slate-400 line-through tabular-nums">₪{originalTotalWithCover}</p>
                </div>
              ) : (
                <p className="text-3xl font-extrabold text-black tabular-nums">₪{totalPrice}</p>
              )}
            </div>
          </div>
        </aside>

        {/* ── Left: Wizard ── */}
        <section className="md:col-span-7">
          <h1 className="mb-2 text-2xl font-extrabold text-slate-900 md:text-3xl">{product.name}</h1>
          <p className="mb-10 text-slate-500">
            בחרו ערים (ניתן לבנות חבילה), צבע מסגרת וכיסוי — והמודל יגיע אליכם הביתה.
          </p>

          {/* Progress */}
          <div className="mb-10 flex items-center gap-1">
            {STEP_LABELS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={label} className="flex flex-1 items-center gap-1">
                  <div className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className={`h-1.5 w-full rounded-full transition-all ${
                        done || active ? "bg-black" : "bg-slate-200"
                      }`}
                    />
                    <span
                      className={`whitespace-nowrap text-xs font-medium ${
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

          {/* Step 0: Cities bundle */}
          {step === 0 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-slate-900">בחרו ערים למודל</h2>
              <p className="mb-6 text-sm text-slate-500">
                ניתן לבחור מספר ערים — לכל עיר נוספת מתוך החבילה מתעדכנת ההנחה (₪
                {BUNDLE_DISCOUNT_PER_EXTRA_CITY} לעיר נוספת).
              </p>

              <div className="space-y-4">
                {citySlots.map((slot, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <CitySearchDropdown
                        cities={cities}
                        selectedCityId={slot.cityId}
                        onSelect={(cid) => updateSlot(index, cid)}
                        isLoading={isLoadingCities}
                        errorMessage={index === 0 ? citiesError : null}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      className="mt-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
                      aria-label="הסר עיר"
                    >
                      <X className="h-5 w-5" strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addEmptySlot}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 py-4 text-sm font-bold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" strokeWidth={2.2} />
                הוסף עיר נוספת
              </button>
            </div>
          )}

          {/* Step 1: Frame color */}
          {step === 1 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-slate-900">צבע מסגרת</h2>
              <p className="mb-5 text-sm text-slate-500">
                נחל על כל הערים בחבילה — שחור או לבן.
              </p>
              <div className="flex flex-wrap gap-5">
                {FRAME_COLORS.map((c) => {
                  const active = frameColor === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setFrameColor(c.name)}
                      className="flex flex-col items-center gap-2"
                    >
                      <span
                        className={[
                          "h-12 w-12 cursor-pointer rounded-full transition-shadow",
                          c.swatchCls,
                          active ? "ring-2 ring-black ring-offset-2 ring-offset-white" : "",
                        ].join(" ")}
                      />
                      <span className="text-sm font-bold text-slate-900">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Cover */}
          {step === 2 && (
            <div>
              <h2 className="mb-1 text-xl font-bold text-slate-900">כיסוי תצוגה</h2>
              <p className="mb-6 text-sm text-slate-500">
                חל על כל המודלים בחבילה — כיסוי אקרילי שקוף אחד לכל הערים.
              </p>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setHasCover(false)}
                  className={`flex w-full items-center gap-5 rounded-2xl border-2 p-6 text-right transition-all ${
                    !hasCover
                      ? "border-black bg-black text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-lg font-bold">ללא כיסוי</p>
                    <p className={`mt-0.5 text-sm ${!hasCover ? "text-white/75" : "text-slate-500"}`}>
                      המודלים כפי שהם
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-extrabold">ללא תוספת תשלום</p>
                </button>

                <button
                  type="button"
                  onClick={() => setHasCover(true)}
                  className={`flex w-full items-center gap-5 rounded-2xl border-2 p-6 text-right transition-all ${
                    hasCover
                      ? "border-black bg-black text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-lg font-bold">כיסוי אקרילי שקוף</p>
                    <p className={`mt-0.5 text-sm ${hasCover ? "text-white/75" : "text-slate-500"}`}>
                      שקוף, קליל ועמיד — שומר על המודל מפני אבק ומגע
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-extrabold">+₪{COVER_PRICE}</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-slate-900">סיכום והוספה לסל</h2>
              <p className="mb-6 text-sm text-slate-500">בדקו את הפרטים לפני ההוספה לסל.</p>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm">
                <Row label="מוצר" value={`מודלו סיטיז - ${product.name}`} />
                <Row label="גודל" value={product.dims} />
                <Row
                  label="ערים"
                  value={resolvedCityDocs.map((c) => c.name).join(" · ") || "-"}
                />
                <Row label="צבע מסגרת" value={frameColor} />
                <Row
                  label="כיסוי"
                  value={hasCover ? `כיסוי אקרילי (+₪${COVER_PRICE})` : "ללא כיסוי"}
                />
                {resolvedCityDocs.length > 1 && (
                  <Row
                    label="הנחת חבילה"
                    value={`−₪${(resolvedCityDocs.length - 1) * BUNDLE_DISCOUNT_PER_EXTRA_CITY}`}
                  />
                )}
                <div className="flex justify-between border-t border-slate-200 pt-3">
                  <span className="font-bold text-slate-900">סה״כ</span>
                  <div className="text-left" dir="ltr">
                    {showBundleStrike ? (
                      <span className="flex flex-col items-end gap-0.5">
                        <span className="text-xl font-extrabold text-black tabular-nums">₪{totalPrice}</span>
                        <span className="text-sm text-slate-400 line-through tabular-nums">
                          ₪{originalTotalWithCover}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xl font-extrabold text-black tabular-nums">₪{totalPrice}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={resolvedCityDocs.length === 0}
                className="mt-8 w-full rounded-2xl bg-black px-6 py-5 text-lg font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                הוסף לסל — ₪{totalPrice}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-10 flex items-center gap-4">
            {step > 0 && (
              <button
                onClick={goBack}
                className="rounded-2xl border-2 border-slate-300 px-8 py-4 text-base font-bold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
              >
                אחורה
              </button>
            )}
            {step < TOTAL_STEPS - 1 && (
              <button
                onClick={goNext}
                disabled={!canGoNext}
                className="flex-1 rounded-2xl bg-black px-8 py-4 text-base font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
              >
                הבא
              </button>
            )}
          </div>
        </section>
      </div>

      {/* ── More Information Accordion ── */}
      <div className="mx-auto mb-24 mt-24 max-w-4xl px-6">
        <h2 className="mb-8 text-2xl font-bold">מידע נוסף</h2>
        <div className="divide-y divide-slate-200 border-b border-t border-slate-200">
          {FAQ_ITEMS(product.dims).map((item) => (
            <AccordionItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CitySearchDropdown — per slot                                       */
/* ------------------------------------------------------------------ */

function CitySearchDropdown({
  cities,
  selectedCityId,
  onSelect,
  isLoading,
  errorMessage,
}: {
  cities: CityDoc[];
  selectedCityId: string | null;
  onSelect: (cityId: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return cities;
    return cities.filter((city) => city.name.includes(q));
  }, [cities, query]);
  const selectedCityName = cities.find((city) => city.id === selectedCityId)?.name ?? null;

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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-right transition-all ${
          open ? "border-black ring-2 ring-black/10" : "border-gray-200 hover:border-gray-400"
        } ${isLoading ? "cursor-wait opacity-60" : ""}`}
        disabled={isLoading}
      >
        <span className={selectedCityName ? "font-medium text-slate-900" : "text-slate-400"}>
          {isLoading ? "טוען ערים..." : selectedCityName ?? "בחרו עיר..."}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={1.8}
        />
      </button>
      {errorMessage && !open && <p className="mt-2 text-xs text-red-500">{errorMessage}</p>}

      {open && (
        <div className="absolute top-full z-30 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש עיר..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <ul className="max-h-60 overflow-y-auto py-1">
            {errorMessage && (
              <li className="px-4 py-3 text-center text-sm text-red-500">{errorMessage}</li>
            )}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-center text-sm text-slate-400">לא נמצאו תוצאות</li>
            )}
            {filtered.map((city) => {
              const isSelected = selectedCityId === city.id;
              return (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(city.id);
                      setQuery("");
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors ${
                      isSelected
                        ? "bg-slate-100 font-semibold text-black"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{city.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-black" strokeWidth={2.5} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
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
      <summary className="flex cursor-pointer select-none items-center justify-between px-1 py-5">
        <span className="font-semibold text-slate-900">{question}</span>
        {open ? (
          <Minus className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={1.8} />
        ) : (
          <Plus className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={1.8} />
        )}
      </summary>
      <div className="px-1 pb-5 text-sm leading-relaxed text-slate-600">{answer}</div>
    </details>
  );
}

/* ------------------------------------------------------------------ */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
