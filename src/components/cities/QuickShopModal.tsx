"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { buildCityStorageImageUrls, type CitySizeKey } from "@/lib/firebase/cities";
import { useCartStore } from "@/lib/store";
import type { CartItem } from "@/lib/types";

const COVER_PRICE = 150;
const BUNDLE_DISCOUNT_PER_EXTRA_CITY = 20;

const SIZE_CONFIG: Record<
  CitySizeKey,
  { label: string; productName: string; dims: string; basePrice: number }
> = {
  minicube: {
    label: "מיני-קובייה",
    productName: "מיני קובייה",
    dims: "10 × 10 ס״מ",
    basePrice: 159,
  },
  cube: {
    label: "קובייה",
    productName: "קובייה",
    dims: "15 × 15 ס״מ",
    basePrice: 199,
  },
};

export type QuickShopCity = {
  name: string;
  slug: string;
  image: string;
  country?: string;
  flag?: string;
};

type Props = {
  city: QuickShopCity | null;
  onClose: () => void;
};

export function QuickShopModal({ city, onClose }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const [selectedSize, setSelectedSize] = useState<CitySizeKey>("minicube");
  const [frameColor, setFrameColor] = useState("שחור");
  const [hasCover, setHasCover] = useState(false);
  const [openSection, setOpenSection] = useState<"frame" | "cover" | null>(null);

  const imageSrc = useMemo(() => {
    if (!city) return "";
    const storageUrl = buildCityStorageImageUrls(city.slug)[selectedSize];
    return storageUrl || city.image || "";
  }, [city, selectedSize]);

  const sizeMeta = SIZE_CONFIG[selectedSize];
  const totalPrice = sizeMeta.basePrice + (hasCover ? COVER_PRICE : 0);

  const toggleSection = (id: "frame" | "cover") => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const handleAddToCart = () => {
    if (!city) return;

    const attrs: string[] = [
      `ערים (1): ${city.name}`,
      `גודל: ${sizeMeta.dims}`,
      `צבע מסגרת: ${frameColor}`,
      hasCover ? `כיסוי אקרילי (+₪${COVER_PRICE})` : "ללא כיסוי",
    ];

    addItem({
      kind: "cities_bundle",
      title: `מודלו סיטיז — ${sizeMeta.productName} · 1 ערים`,
      imageUrl: imageSrc || city.image,
      department: "cities",
      productName: sizeMeta.productName,
      sizeKey: selectedSize,
      sizeLabel: sizeMeta.dims,
      frameColor,
      hasCover,
      coverPrice: COVER_PRICE,
      bundleDiscountPerExtraCity: BUNDLE_DISCOUNT_PER_EXTRA_CITY,
      cities: [{ name: city.name, slug: city.slug, imageUrl: imageSrc || city.image }],
      quantity: 1,
      unitPrice: totalPrice,
      subtotal: totalPrice,
      attributes: attrs,
    } as Omit<CartItem, "id" | "addedAt">);

    openCart();
    onClose();
  };

  if (!city) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-shop-title"
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute end-4 top-4 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="סגור"
        >
          <X className="h-5 w-5" strokeWidth={1.8} />
        </button>

        <div className="mt-2 flex flex-col items-center text-center">
          <div className="relative mb-4 aspect-square w-full max-w-[220px] overflow-hidden rounded-xl bg-slate-100">
            <QuickShopCityImage key={imageSrc} src={imageSrc} cityName={city.name} />
          </div>

          <h2 id="quick-shop-title" className="text-2xl font-extrabold text-slate-900">
            {city.name}
          </h2>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-black" dir="ltr">
            ₪{totalPrice}
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          {(["minicube", "cube"] as const).map((key) => {
            const active = selectedSize === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedSize(key)}
                className={[
                  "flex-1 rounded-full border-2 py-2.5 text-sm font-bold transition-all",
                  active
                    ? "border-black bg-black text-white"
                    : "border-slate-200 bg-white text-slate-800 hover:border-slate-400",
                ].join(" ")}
              >
                {SIZE_CONFIG[key].label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
          <AccordionRow
            title="צבע מסגרת"
            summary={frameColor}
            isOpen={openSection === "frame"}
            onToggle={() => toggleSection("frame")}
          >
            <div className="flex gap-3 pt-2">
              {(["שחור", "לבן"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFrameColor(c)}
                  className={[
                    "rounded-full border-2 px-4 py-2 text-sm font-semibold",
                    frameColor === c
                      ? "border-black bg-black text-white"
                      : "border-slate-200 text-slate-800 hover:border-slate-400",
                  ].join(" ")}
                >
                  {c}
                </button>
              ))}
            </div>
          </AccordionRow>

          <AccordionRow
            title="כיסוי תצוגה"
            summary={hasCover ? `אקרילי (+₪${COVER_PRICE})` : "ללא כיסוי (+₪0)"}
            isOpen={openSection === "cover"}
            onToggle={() => toggleSection("cover")}
          >
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setHasCover(false)}
                className={[
                  "w-full rounded-xl border-2 px-4 py-3 text-right text-sm font-semibold transition-all",
                  !hasCover
                    ? "border-black bg-black text-white"
                    : "border-slate-200 text-slate-800 hover:border-slate-400",
                ].join(" ")}
              >
                ללא כיסוי (+₪0)
              </button>
              <button
                type="button"
                onClick={() => setHasCover(true)}
                className={[
                  "w-full rounded-xl border-2 px-4 py-3 text-right text-sm font-semibold transition-all",
                  hasCover
                    ? "border-black bg-black text-white"
                    : "border-slate-200 text-slate-800 hover:border-slate-400",
                ].join(" ")}
              >
                כיסוי אקרילי (+₪{COVER_PRICE})
              </button>
            </div>
          </AccordionRow>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="mt-8 w-full rounded-2xl bg-black py-4 text-base font-bold text-white transition-colors hover:bg-slate-800"
        >
          הוספה מהירה לסל
        </button>
      </div>
    </div>
  );
}

function QuickShopCityImage({ src, cityName }: { src: string; cityName: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
        <span className="text-xs text-slate-400">תמונה חסרה</span>
        <span className="text-lg font-semibold text-slate-600">{cityName}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={cityName}
      fill
      className="object-contain"
      sizes="220px"
      unoptimized={src.startsWith("http")}
      onError={() => setFailed(true)}
    />
  );
}

function AccordionRow({
  title,
  summary,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-900">{title}</span>
          <span className="block text-xs text-slate-500">{summary}</span>
        </span>
        {isOpen ? (
          <Minus className="h-5 w-5 shrink-0 text-slate-500" strokeWidth={1.8} />
        ) : (
          <Plus className="h-5 w-5 shrink-0 text-slate-500" strokeWidth={1.8} />
        )}
      </button>
      {isOpen && <div className="border-t border-slate-100 px-4 pb-4">{children}</div>}
    </div>
  );
}
