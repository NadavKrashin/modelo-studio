import Link from "next/link";
import { ShieldCheck, Truck, MapPin, ArrowLeft } from "lucide-react";

const WORLDS = [
  {
    title: "מודלו סטודיו",
    desc: "ספריית מודלים ענקית המוכנה להדפסה.",
    href: "/studio",
    accent: "text-slate-700",
    accentBg: "bg-slate-100",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <rect x="20" y="28" width="40" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M20 28L40 16L60 28" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M40 16V52" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.4" />
        <path d="M20 28L40 40L60 28" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <circle cx="40" cy="40" r="3" fill="currentColor" opacity="0.3" />
        <rect x="12" y="60" width="56" height="8" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <circle cx="22" cy="64" r="2" fill="currentColor" opacity="0.4" />
        <path d="M28 64H62" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
        <circle cx="68" cy="18" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <path d="M72 22L76 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      </svg>
    ),
  },
  {
    title: "מודלו פרסונל",
    desc: "יצירת דמויות תלת-ממדיות אישיות מתוך תמונה.",
    href: "/personal",
    accent: "text-blue-600",
    accentBg: "bg-blue-50",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <circle cx="40" cy="24" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M22 58C22 46 30 38 40 38C50 38 58 46 58 58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M58 30L64 24L70 30L64 36Z" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <path d="M14 44L20 38L26 44L20 50Z" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <circle cx="40" cy="24" r="4" fill="currentColor" opacity="0.15" />
        <path d="M30 62H50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.3" />
        <path d="M62 42C62 42 66 46 66 50" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
        <circle cx="12" cy="28" r="2" fill="currentColor" opacity="0.2" />
        <circle cx="68" cy="52" r="2" fill="currentColor" opacity="0.2" />
      </svg>
    ),
  },
  {
    title: "מודלו סיטיז",
    desc: "ערים אהובות בתלת-ממד מדויק.",
    href: "/cities",
    accent: "text-amber-600",
    accentBg: "bg-amber-50",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <rect x="14" y="34" width="12" height="30" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="30" y="20" width="10" height="44" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="44" y="28" width="10" height="36" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="58" y="38" width="10" height="26" rx="1" stroke="currentColor" strokeWidth="2" />
        <path d="M10 64H72" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="16" y="38" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="16" y="44" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="21" y="38" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="32" y="24" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="32" y="30" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="32" y="36" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="46" y="32" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="46" y="38" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
        <path d="M35 14L35 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <path d="M32 17H38" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
  },
  {
    title: "מודלו ספורט",
    desc: "כוורת מודולרית להנצחת הישגי ספורט.",
    href: "/sport",
    accent: "text-orange-600",
    accentBg: "bg-orange-50",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <path d="M40 10L54 18V34L40 42L26 34V18Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M22 38L36 46V62L22 70L8 62V46Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.5" />
        <path d="M58 38L72 46V62L58 70L44 62V46Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.5" />
        <circle cx="40" cy="26" r="5" fill="currentColor" opacity="0.12" />
        <circle cx="40" cy="24" r="2" fill="currentColor" opacity="0.3" />
        <path d="M37 28H43" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <path d="M38 30L40 34L42 30" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
        <circle cx="22" cy="54" r="3" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <path d="M56 52L60 56" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <path d="M60 52L56 56" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      </svg>
    ),
  },
];

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "חומרים יוקרתיים" },
  { icon: Truck, label: "משלוח מהיר ומבוטח" },
  { icon: MapPin, label: "דיוק טופוגרפי מדויק" },
];

export default function HomePage() {
  return (
    <div className="bg-white text-slate-900 font-sans" dir="rtl">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-40 right-1/4 w-[600px] h-[600px] bg-slate-800/40 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-slate-700/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-28 md:pt-36 md:pb-40 text-center">
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold text-white leading-[1.08] tracking-tight drop-shadow-md mb-6">
            מודלו: הופכים
            <br />
            דמיון לתלת-ממד.
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            שירותי הדפסת תלת-ממד פרימיום, אישית ומהירה, מכל העולם ולכל מטרה.
          </p>
          <a
            href="#worlds"
            className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-10 py-4 font-bold text-base hover:bg-slate-100 transition-colors shadow-lg shadow-white/10"
          >
            גלו את העולמות שלנו
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          </a>
        </div>
      </section>

      {/* ── About ── */}
      <section className="max-w-4xl mx-auto py-24 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
          מומחים בהדפסת תלת-ממד פרימיום
        </h2>
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
          אנחנו משלבים טכנולוגיה מתקדמת, חומרים יוקרתיים ושירות אישי כדי להעניק
          לכם פתרון תלת-ממדי מושלם. מהדפסת ספריית מודלים ענקית ועד הנצחת זיכרונות
          אישיים, מודלו הוא המקום שלכם.
        </p>
      </section>

      {/* ── 4 Worlds ── */}
      <section id="worlds" className="bg-slate-50 border-y border-slate-200 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
            ארבעת העולמות של מודלו
          </h2>
          <p className="text-center text-slate-500 mb-16 text-base">
            כל עולם — חוויה ייחודית של עיצוב, יצירה והדפסה בתלת-ממד.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
            {WORLDS.map((w) => (
              <Link
                key={w.title}
                href={w.href}
                className="group flex flex-col items-center text-center bg-white rounded-2xl border border-slate-200 p-8 transition-all duration-300 hover:scale-[1.04] hover:shadow-xl hover:border-slate-300"
              >
                <div className={`w-24 h-24 ${w.accentBg} rounded-2xl flex items-center justify-center mb-6 ${w.accent} transition-colors duration-300`}>
                  {w.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{w.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">{w.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 group-hover:text-black transition-colors">
                  גלה עוד
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section className="bg-white py-12 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-slate-900" strokeWidth={1.5} />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
