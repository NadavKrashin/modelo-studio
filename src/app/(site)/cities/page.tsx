import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  Search,
  Gift,
  Map,
  Award,
} from "lucide-react";
import { CitiesBestSellersSection } from "@/components/cities/CitiesBestSellersSection";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const PRODUCTS = [
  {
    slug: "cube",
    name: "קובייה (15x15)",
    price: 199,
    dims: "15 × 15 ס״מ",
    image: "/images/cities/cube.png",
  },
  {
    slug: "minicube",
    name: "מיני קובייה (10x10)",
    price: 159,
    dims: "10 × 10 ס״מ",
    image: "/images/cities/minicube.png",
  },
] as const;

const FEATURES: { icon: typeof Star; title: string; desc: string }[] = [
  { icon: Search, title: "עדין מגרגיר חול", desc: "רזולוציית הדפסה גבוהה במיוחד לפרטי אדריכלות מדויקים." },
  { icon: ShieldCheck, title: "קל לניקוי", desc: "משטח חלק שניתן לנגב בקלות וישמור על מראה חדש." },
  { icon: Gift, title: "מתנה מושלמת", desc: "אריזת פרימיום מוכנה למתנה — ליום הולדת, חתונה או חנוכת בית." },
  { icon: Map, title: "טכנולוגיית AI וסריקה", desc: "נתוני טופוגרפיה ואדריכלות מדויקים מגוגל ו-OpenStreetMap." },
  { icon: Award, title: "קולקציה צומחת", desc: "ערים חדשות מתווספות כל הזמן — 150+ ערים מרחבי העולם." },
];

const STORY_CARDS = [
  { image: "/images/cities/tel-aviv.jpeg", text: "זיכרונות לכל החיים" },
  { image: "/images/cities/new-york.jpeg", text: "תנו חתיכה מהעולם" },
  { image: "/images/cities/london.jpeg", text: "חגגו עיצוב אדריכלי" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CitiesPage() {
  return (
    <div className="bg-white text-slate-900" dir="rtl">
      {/* ── Section 1: Hero with Background Image ── */}
      <section className="relative min-h-[70vh] flex flex-col justify-center items-center overflow-hidden">
        <Image
          src="/images/cities/city.jpeg"
          alt="Cities skyline"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 z-10" />

        <div className="relative z-20 text-center px-6 max-w-5xl mx-auto">
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.05] text-white drop-shadow-lg mb-6">
            מודלו סיטיז.
            <br />
            העיר שלכם בתלת־ממד.
          </h1>
          <p className="text-base md:text-lg text-white/90 mb-6">
            משלוח לכל הארץ&ensp;|&ensp;בחרו מתוך 150+ ערים
          </p>
          <div className="flex items-center justify-center gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" strokeWidth={0} />
            ))}
          </div>
          <p className="text-sm text-white/80">מאות לקוחות מרוצים</p>
        </div>
      </section>

      {/* ── Section 2: Compact Product Grid ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">גלו את העולם בתלת־ממד</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end max-w-3xl mx-auto">
          {PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              href={`/cities/${p.slug}`}
              className="group flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="aspect-square w-full max-w-[280px] mx-auto flex items-center justify-center my-6">
                <div className={`relative w-full h-full ${p.slug === 'minicube' ? 'scale-[0.65]' : 'scale-100'} transition-transform`}>
                  <Image src={p.image} alt={p.name} fill className="object-contain" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1 group-hover:text-black transition-colors">{p.name}</h3>
              <p className="text-sm text-slate-500 mb-2">{p.dims}</p>
              <p className="text-2xl font-extrabold mb-4">₪{p.price}</p>
              <span className="rounded-xl bg-black text-white py-3 px-8 text-sm font-bold group-hover:bg-slate-800 transition-colors">
                קנו עכשיו
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Section 3: Features ── */}
      <section className="bg-slate-50 border-y border-slate-200 py-20 px-6">
        <h2 className="text-3xl font-bold text-center mb-16">
          הפרטים הקטנים שעושים את ההבדל
        </h2>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-6 text-center">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-slate-700" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[180px]">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 4: Bestsellers Carousel ── */}
      <CitiesBestSellersSection />

      {/* ── Section 5: Story Cards ── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-4xl font-extrabold text-center mb-4">
          החזיקו את העיר האהובה עליכם בידיים
        </h2>
        <p className="text-center text-slate-500 mb-12">העיר שלכם, הסיפור שלכם</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STORY_CARDS.map((card) => (
            <div
              key={card.text}
              className="relative aspect-square rounded-2xl overflow-hidden"
            >
              <Image src={card.image} alt={card.text} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <p className="absolute bottom-6 right-6 left-6 text-white text-2xl font-extrabold leading-tight">
                {card.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
