"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Truck,
} from "lucide-react";

const PROCESS_STEPS = [
  { icon: Camera, title: "מעלים תמונה", desc: "אתם שולחים לנו תמונה ברורה — אנחנו כבר נדאג לכל השאר." },
  { icon: Sparkles, title: "עיצוב המודלו", desc: "המעצבים וה-AI שלנו הופכים את התמונה למודל תלת־ממדי חי." },
  { icon: CheckCircle2, title: "סקיצה לאישור", desc: "תקבלו מאיתנו סקיצה דיגיטלית לאישור סופי לפני ההדפסה." },
  { icon: Truck, title: "הדפסה ומשלוח", desc: "הדפסה באיכות גבוהה, אריזה יוקרתית ומשלוח מהיר עד הבית." },
];

const GALLERY = [
  { id: 1, src: "/images/1.jpeg", alt: "מודלו אישי 1" },
  { id: 2, src: "/images/2.jpeg", alt: "מודלו אישי 2" },
  { id: 3, src: "/images/3.jpeg", alt: "מודלו אישי 3" },
  { id: 4, src: "/images/4.jpeg", alt: "מודלו אישי 4" },
  { id: 5, src: "/images/5.jpeg", alt: "מודלו אישי 5" },
  { id: 6, src: "/images/6.jpeg", alt: "מודלו אישי 6" },
  { id: 7, src: "/images/7.jpeg", alt: "מודלו אישי 7" },
  { id: 8, src: "/images/8.jpeg", alt: "מודלו אישי 8" },
];

const FAQS = [
  { q: "ממה עשוי המודלו?", a: "המודל עשוי מחומר PLA — פולימר ביולוגי חזק, קל ובעל גימור חלק. אחד החומרים הנפוצים ביותר בהדפסת תלת־ממד." },
  { q: "כמה זמן לוקח לייצר את המודל?", a: "עד 14 ימי עסקים מרגע אישור ההזמנה והתשלום." },
  { q: "האם אפשר לבחור פרטי עיצוב?", a: "כן — ניתן לציין צבע עיניים, לבוש, חזות ועוד. אנו מתאימים ככל הניתן." },
  { q: "מה האחריות במקרה של שבר?", a: "המודל נארז בקפידה. אם הגיע שבור — צרו קשר ונטפל." },
  { q: "האם אתם שומרים על פרטיות התמונות?", a: "כן. התמונות משמשות אך ורק להכנת הדגם ונמחקות בסיום התהליך." },
];

export default function PersonalPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth / 3;

    const handleLoop = () => {
      const oneSet = el.scrollWidth / 3;
      if (el.scrollLeft <= oneSet * 0.5) el.scrollLeft += oneSet;
      else if (el.scrollLeft >= oneSet * 1.5) el.scrollLeft -= oneSet;
    };
    el.addEventListener("scroll", handleLoop);
    return () => el.removeEventListener("scroll", handleLoop);
  }, []);

  const scroll = (dir: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.25;
    el.scrollBy({ left: dir === "next" ? step : -step, behavior: "smooth" });
  };

  return (
    <div className="bg-white text-slate-900" dir="rtl">
      {/* ── Hero ── */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/personal-hero-bj.jpeg"
          alt="Modelo Personal hero"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/35 z-10" />

        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.05] text-white drop-shadow-lg mb-6">
            הדמויות שלכם.
            <br />
            על המדף שלכם.
          </h1>
          <p className="text-base md:text-lg text-white/85 mb-8">
            מודל תלת־ממדי מותאם אישית — של אדם או חיית מחמד
          </p>
          <Link
            href="/personal/wizard"
            className="inline-block rounded-2xl bg-black px-10 py-4 text-white font-bold text-base hover:bg-slate-800 transition-colors"
          >
            התחל בעיצוב אישי
          </Link>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="relative px-6 py-28 overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-20 right-1/4 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute top-1/3 -left-10 w-56 h-56 rounded-full bg-blue-500/8 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 rounded-full bg-slate-200/30 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 text-blue-600">איך זה עובד?</h2>
          <p className="text-center text-slate-500 mb-16 text-base">תהליך פשוט בארבעה שלבים — מהתמונה ועד הדלת.</p>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 text-center">
            <div className="hidden md:block absolute top-9 right-[12.5%] left-[12.5%] h-px bg-gradient-to-l from-blue-200 via-blue-300 to-blue-200" aria-hidden="true" />

            {PROCESS_STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="group relative flex flex-col items-center rounded-2xl border border-transparent bg-white/70 backdrop-blur-sm px-4 py-8 transition-all duration-300 ease-in-out hover:-translate-y-3 hover:scale-105 hover:border-blue-300 hover:shadow-[0_12px_40px_-8px_rgba(59,130,246,0.25)]"
                >
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-5 transition-all duration-300 group-hover:border-blue-400 group-hover:shadow-md group-hover:shadow-blue-200/50">
                    <Icon className="w-7 h-7 text-blue-500 transition-all duration-300 group-hover:text-blue-600 group-hover:animate-pulse" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-base mb-2 text-slate-900">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[220px]">{s.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/personal/wizard"
              className="inline-block rounded-2xl bg-black px-10 py-4 text-white font-bold text-base hover:bg-slate-800 transition-colors"
            >
              התחל בעיצוב אישי
            </Link>
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="bg-slate-50 border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-2">גלריית עבודות</h2>
          <p className="text-slate-500 mb-10">דוגמאות למודלים מותאמים אישית מהסטודיו שלנו.</p>

          <div className="relative">
            <div
              ref={scrollRef}
              dir="ltr"
              className="flex gap-4 overflow-x-auto scrollbar-hide"
            >
              {[...GALLERY, ...GALLERY, ...GALLERY].map((img, i) => (
                <div key={`${img.id}-${i}`} data-card className="shrink-0 w-[70vw] sm:w-[45vw] md:w-[23%]">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 relative">
                    <Image src={img.src} alt={img.alt} fill className="object-cover" />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll("prev")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors z-10"
              aria-label="הקודם"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={() => scroll("next")}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors z-10"
              aria-label="הבא"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">שאלות נפוצות</h2>

        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <button
                key={faq.q}
                onClick={() => setOpenFaq(isOpen ? null : i)}
                className="w-full py-5 px-1 text-right"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-900">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    strokeWidth={1.8}
                  />
                </div>
                <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] mt-3" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="rounded-3xl bg-black p-10 md:p-14">
          <h3 className="text-white text-3xl font-bold mb-4">מוכנים להתחיל?</h3>
          <p className="text-slate-300 text-base mb-8 max-w-lg mx-auto leading-relaxed">
            בחרו סוג מודל, העלו תמונה — והמודלו שלכם בדרך אליכם.
          </p>
          <Link
            href="/personal/wizard"
            className="inline-block rounded-2xl bg-white text-black px-10 py-4 font-bold text-base hover:bg-slate-100 transition-colors"
          >
            התחל בעיצוב אישי
          </Link>
        </div>
      </section>
    </div>
  );
}
