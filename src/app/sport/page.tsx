"use client";

import Image from "next/image";
import Link from "next/link";

const PRODUCTS = [
  {
    slug: "route",
    title: "משושה מסלול",
    desc: "העלו קובץ GPX מ-Strava או Garmin והפכו את המסלול למודל טופוגרפי תלת־ממדי.",
    price: 189,
    image: "/images/sport/map.jpeg",
    href: "/sport/route",
  },
  {
    slug: "medal",
    title: "משושה מדליה",
    desc: "משושה ייעודי עם מתלה אינטגרלי להצגת המדליות שהרווחתם בזיעה.",
    price: 89,
    image: "/images/sport/medal.jpeg",
    href: "/sport/medal",
  },
  {
    slug: "details",
    title: "משושה תיאור מירוץ",
    desc: "הנציחו את הרגע: שם המירוץ, תאריך וזמן הסיום המדויק שלכם מובלטים בתלת־ממד.",
    price: 129,
    image: "/images/sport/detail.jpeg",
    href: "/sport/details",
  },
] as const;

export default function SportPage() {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              href={p.href}
              className="group flex flex-col items-center text-center rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="w-full aspect-[4/3] relative bg-slate-100">
                <Image src={p.image} alt={p.title} fill className="object-cover" />
              </div>

              <div className="p-8 flex flex-col items-center flex-1">
                <h3 className="text-xl font-bold mb-3">{p.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-[280px]">{p.desc}</p>

                <p className="text-2xl font-extrabold mb-6">₪{p.price}</p>

                <span className="mt-auto rounded-xl bg-black text-white py-3 px-8 text-sm font-bold group-hover:bg-slate-800 transition-colors">
                  עצבו עכשיו
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
