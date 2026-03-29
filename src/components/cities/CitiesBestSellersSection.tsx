"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  buildCityStorageImageUrls,
  getBestSellerCities,
  type CityDoc,
} from "@/lib/firebase/cities";
import { QuickShopModal, type QuickShopCity } from "./QuickShopModal";

function cityDocToQuickShop(c: CityDoc): QuickShopCity {
  const storage = buildCityStorageImageUrls(c.slug);
  const fromDoc = c.images?.minicube;
  const image =
    typeof fromDoc === "string" && fromDoc.length > 0
      ? fromDoc
      : (storage.minicube ?? "/images/cities/city.jpeg");

  return {
    name: c.name,
    slug: c.slug,
    image,
  };
}

export function CitiesBestSellersSection() {
  const [quickShopCity, setQuickShopCity] = useState<QuickShopCity | null>(null);
  const [cards, setCards] = useState<QuickShopCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const docs = await getBestSellerCities();
      setCards(docs.map(cityDocToQuickShop));
    } catch (e) {
      console.error("[BestSellers]", e);
      setFetchError("טעינת ההמלצות נכשלה. נסו לרענן.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">הנמכרים ביותר</h2>
          <p className="text-slate-500 mt-1">מודלים תלת־ממדיים | נוף עירוני</p>
        </div>

        {fetchError && (
          <p className="mb-6 text-sm text-red-600" role="alert">
            {fetchError}
          </p>
        )}

        {loading ? (
          <div className="flex gap-6 overflow-x-auto pb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 animate-pulse rounded-2xl bg-slate-100"
                style={{ width: "18rem", height: "22rem" }}
              />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-8 text-center text-slate-500">
            אין ערים מסומנות כ&quot;נמכר ביותר&quot; כרגע. בחרו ערים בלוח הניהול.
          </p>
        ) : (
          <div className="flex overflow-x-auto snap-x gap-6 pb-8 scrollbar-hide">
            {cards.map((b) => (
              <div key={b.slug} className="flex-shrink-0 snap-start w-72">
                <button
                  type="button"
                  onClick={() => setQuickShopCity(b)}
                  className="group block w-full text-right"
                >
                  <div className="w-72 h-72 rounded-2xl overflow-hidden bg-slate-100 relative mb-4 ring-0 transition-shadow group-hover:ring-2 group-hover:ring-black/10">
                    <Image src={b.image} alt={b.name} fill className="object-cover" unoptimized={b.image.startsWith("http")} />
                  </div>
                </button>
                <p
                  className="text-2xl font-extrabold mb-3 text-slate-900 cursor-pointer hover:text-slate-700 transition-colors"
                  onClick={() => setQuickShopCity(b)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setQuickShopCity(b);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {b.name}
                </p>
                <button
                  type="button"
                  onClick={() => setQuickShopCity(b)}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-black px-5 py-2.5 text-sm font-bold hover:bg-black hover:text-white transition-colors"
                >
                  הוסף לסל
                  <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-4">
          <Link
            href="/cities/products"
            className="inline-block rounded-xl bg-black text-white px-10 py-4 font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            חקור את כל הערים
          </Link>
        </div>
      </section>

      <QuickShopModal
        key={quickShopCity?.slug ?? "closed"}
        city={quickShopCity}
        onClose={() => setQuickShopCity(null)}
      />
    </>
  );
}
