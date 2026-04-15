"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { getFirebaseClientFirestore } from "@/lib/firebase/client";
import {
  buildSportProductThumbnailUrlForBucket,
  mapSportProductDocument,
  SPORT_PRODUCTS_COLLECTION,
} from "@/lib/firebase/sport-products-shared";
import type { SportProduct } from "@/lib/types/sport-product";

const SLUG_FALLBACK: Record<string, { desc: string; localImage: string }> = {
  route: {
    desc: "העלו קובץ GPX מ-Strava או Garmin והפכו את המסלול למודל טופוגרפי תלת־ממדי.",
    localImage: "/images/sport/map.jpeg",
  },
  medal: {
    desc: "משושה ייעודי עם מתלה אינטגרלי להצגת המדליות שהרווחתם בזיעה.",
    localImage: "/images/sport/medal.jpeg",
  },
  details: {
    desc: "הנציחו את הרגע: שם המירוץ, תאריך וזמן הסיום המדויק שלכם מובלטים בתלת־ממד.",
    localImage: "/images/sport/detail.jpeg",
  },
};

const STORE_SLUG_ORDER = ["route", "medal", "details"] as const;

function sortSportProductsForStorefront(products: SportProduct[]): SportProduct[] {
  return [...products].sort((a, b) => {
    const ia = (STORE_SLUG_ORDER as readonly string[]).indexOf(a.slug);
    const ib = (STORE_SLUG_ORDER as readonly string[]).indexOf(b.slug);
    if (ia !== -1 || ib !== -1) {
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }
    return a.nameHe.localeCompare(b.nameHe, "he");
  });
}

function sportWizardHref(slug: string): string {
  return `/sport/${slug}`;
}

function resolveCardImageSrc(product: SportProduct): string {
  if (product.imageUrl?.startsWith("http")) return product.imageUrl;
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const remote = buildSportProductThumbnailUrlForBucket(bucket, product.slug);
  if (remote) return remote;
  return SLUG_FALLBACK[product.slug]?.localImage ?? "/images/sport-sample.jpeg";
}

export default function SportPage() {
  const [products, setProducts] = useState<SportProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const sortedProducts = useMemo(
    () => sortSportProductsForStorefront(products),
    [products],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setLoadError(null);
        const db = getFirebaseClientFirestore();
        const q = query(collection(db, SPORT_PRODUCTS_COLLECTION), where("isActive", "==", true));
        const snap = await getDocs(q);
        if (cancelled) return;
        setProducts(
          snap.docs.map((d) =>
            mapSportProductDocument(d.id, d.data() as Record<string, unknown>),
          ),
        );
      } catch (error) {
        if (cancelled) return;
        console.error("SPORT DATA FETCH ERROR:", error);
        setProducts([]);
        setLoadError("טעינת מוצרי הספורט נכשלה. נסו שוב בעוד רגע.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white text-slate-900" dir="rtl">
      {/* ── Hero ── */}
      <section className="relative min-h-[70vh] flex flex-col justify-center items-center overflow-hidden">
        <Image
          src="/images/sport/main.jpeg"
          alt="Modelo Sport"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50 z-10" />

        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
          <p className="text-xl font-medium tracking-wide mb-4 text-white/90">
            הכוורת שלכם. ההישגים שלכם.
          </p>
          <h1 className="text-6xl md:text-7xl font-extrabold text-white drop-shadow-lg mb-8">
            מודלו ספורט.
          </h1>
          <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
            הרכיבו קיר תצוגה מודולרי מרהיב מהמדליות, המסלולים והזמנים שלכם.
          </p>
        </div>
      </section>

      {/* ── Hexagon Collection ── */}
      <section className="max-w-7xl mx-auto py-24 px-6">
        <h2 className="text-4xl font-bold text-center mb-16">בחרו את המשושה הבא שלכם</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden animate-pulse"
              >
                <div className="w-full aspect-[4/3] bg-slate-100" />
                <div className="p-8 space-y-3">
                  <div className="h-6 bg-slate-100 rounded" />
                  <div className="h-4 bg-slate-100 rounded" />
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-6 bg-slate-100 rounded w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <p className="text-center text-red-600 text-lg max-w-xl mx-auto">{loadError}</p>
        ) : sortedProducts.length === 0 ? (
          <p className="text-center text-slate-500 text-lg max-w-xl mx-auto">
            אין מוצרי ספורט פעילים להצגה כרגע. חזרו בקרוב או פנו אלינו לפרטים.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {sortedProducts.map((p) => {
              const fallback = SLUG_FALLBACK[p.slug];
              const desc = fallback?.desc ?? "";
              const imageSrc = resolveCardImageSrc(p);

              return (
                <Link
                  key={p.id}
                  href={sportWizardHref(p.slug)}
                  className="group flex flex-col items-center text-center rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="w-full aspect-[4/3] relative bg-slate-100">
                    <Image
                      src={imageSrc}
                      alt={p.nameHe}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  <div className="p-8 flex flex-col items-center flex-1">
                    <h3 className="text-xl font-bold mb-3">{p.nameHe}</h3>
                    {desc ? (
                      <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-[280px]">{desc}</p>
                    ) : (
                      <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-[280px]">
                        עצבו את המשושה שלכם.
                      </p>
                    )}

                    <p className="text-lg font-bold text-slate-900 mb-6 tabular-nums">₪{p.basePrice}</p>

                    <span className="mt-auto rounded-xl bg-black text-white py-3 px-8 text-sm font-bold group-hover:bg-slate-800 transition-colors">
                      עצבו עכשיו
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
