'use client';

import { useEffect, useRef, useState } from 'react';
import { PersonalWizard } from '@/components/personal/PersonalWizard';

const ORDER_STEPS = [
  {
    step: 1,
    title: 'שליחת תמונה',
    description:
      'לאחר ביצוע ההזמנה, אתם שולחים אלינו תמונה ברורה – אנחנו נדאג לכל השאר.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
        <circle cx="9" cy="10" r="1.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m20 15-4-4-5.5 5.5" />
      </svg>
    ),
  },
  {
    step: 2,
    title: 'יצירת מודלו בהתאמה אישית',
    description:
      'צוות המעצבים שלנו מפיק עבורכם מודל תלת־ממדי שמבוסס על התמונה ששלחתם.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 4.5 19.5 9.5M5 19l3.75-.75L18 9a2.12 2.12 0 0 0 0-3l-.5-.5a2.12 2.12 0 0 0-3 0L5.25 14.75 4.5 18.5 5 19Z" />
      </svg>
    ),
  },
  {
    step: 3,
    title: 'סקיצה לאישור',
    description:
      'תקבלו סקיצה לאישור – רק לאחר שתאשרו, נמשיך לשלב הבא.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4 10-10" />
      </svg>
    ),
  },
  {
    step: 4,
    title: 'הדפסה תלת־ממדית',
    description: 'אחת המדפסות המתקדמות שלנו תתחיל בהדפסה.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8V4h10v4M4.5 8h15A1.5 1.5 0 0 1 21 9.5v7A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5v-7A1.5 1.5 0 0 1 4.5 8Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 15h8v5H8z" />
      </svg>
    ),
  },
  {
    step: 5,
    title: 'אריזה ומשלוח',
    description:
      'לאחר גימור ובדיקה, המודלו נארז בקפידה ויוצא לדרך – היישר אליכם.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 3.5 7.5 12 12l8.5-4.5L12 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 7.5V16.5L12 21l8.5-4.5V7.5" />
      </svg>
    ),
  },
];

const galleryImages = [
  { id: 1, src: '/images/1.jpeg', alt: 'מודלו אישי 1' },
  { id: 2, src: '/images/2.jpeg', alt: 'מודלו אישי 2' },
  { id: 3, src: '/images/3.jpeg', alt: 'מודלו אישי 3' },
  { id: 4, src: '/images/4.jpeg', alt: 'מודלו אישי 4' },
  { id: 5, src: '/images/5.jpeg', alt: 'מודלו אישי 5' },
  { id: 6, src: '/images/6.jpeg', alt: 'מודלו אישי 6' },
  { id: 7, src: '/images/7.jpeg', alt: 'מודלו אישי 7' },
  { id: 8, src: '/images/8.jpeg', alt: 'מודלו אישי 8' },
];

const faqs = [
  {
    question: 'ממה עשוי המודלו?',
    answer:
      'המודל עשוי מחומר דמוי פלסטיק מסוג PLA (Polylactic Acid) – זהו פולימר ביולוגי מתכלה שמבוסס על עמילנים טבעיים (כמו תירס או סוכר), הנחשב לידידותי יחסית לסביבה. PLA הוא אחד החומרים הנפוצים ביותר בהדפסת תלת־ממד בשל חוזקו, משקלו הקל, קלות העיבוד והגימור החלק שהוא מאפשר.',
  },
  {
    question: 'האם ניתן לבטל או לשנות הזמנה לאחר שבוצעה?',
    answer:
      'לאחר אישור הסקיצה על ידכם, וכיוון שהמודלים מיוצרים בהתאמה אישית לפי תמונה, אין אפשרות לבטל או לשנות לאחר תחילת הייצור.',
  },
  {
    question: 'האם אפשר לבחור פרטי עיצוב מיוחדים למודל?',
    answer:
      'כן, בעת ההזמנה ניתן לציין בקשות מיוחדות (כגון צבע עיניים, חזות ועוד), ואנו משתדלים להתאים ככל הניתן.',
  },
  {
    question: 'מה האחריות במקרה של שבר או פגם?',
    answer:
      'כיוון שמדובר במודל מותאם אישית, ולא בצעצוע. אין אחריות על שברים או פגמים שנגרמים לאחר קבלת המוצר. את המודלו אנחנו אורזים בקפדנות - אם הגיע אליכם שבור - צרו איתנו קשר!',
  },
  {
    question: 'כמה זמן לוקח לייצר ולהכין את המודל?',
    answer:
      'המודלים מיוצרים בהזמנה אישית. זמן ההכנה והאספקה הוא עד 14 ימי עסקים מרגע אישור ההזמנה והתשלום.',
  },
  {
    question: 'האם אתם שומרים על פרטיות התמונות שאני שולח?',
    answer:
      'כן. התמונות משמשות אך ורק להכנת הדגם ונמחקות לאחר סיום התהליך בהתאם לתקנות הגנת הפרטיות.',
  },
];

export default function ModeloPersonalPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const galleryScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scroller = galleryScrollRef.current;
    if (!scroller) return;
    // Start from the middle copy for seamless infinite looping.
    scroller.scrollLeft = scroller.scrollWidth / 3;

    const handleInfiniteLoop = () => {
      const oneSetWidth = scroller.scrollWidth / 3;
      if (scroller.scrollLeft <= oneSetWidth * 0.5) {
        scroller.scrollLeft += oneSetWidth;
      } else if (scroller.scrollLeft >= oneSetWidth * 1.5) {
        scroller.scrollLeft -= oneSetWidth;
      }
    };

    scroller.addEventListener('scroll', handleInfiniteLoop);
    return () => scroller.removeEventListener('scroll', handleInfiniteLoop);
  }, []);

  const scrollGallery = (direction: 'prev' | 'next') => {
    const scroller = galleryScrollRef.current;
    if (!scroller) return;

    const firstCard = scroller.querySelector<HTMLElement>('[data-gallery-card]');
    const step = firstCard ? firstCard.offsetWidth + 16 : scroller.clientWidth * 0.25;

    scroller.scrollBy({
      left: direction === 'next' ? step : -step,
      behavior: 'smooth',
    });
  };

  return (
    <div className="bg-white text-gray-900" dir="rtl">
      <section
        className="relative w-full min-h-[75vh] flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat text-center px-4 sm:px-6"
        style={{ backgroundImage: "url('/images/personal-hero-bj.jpeg')" }}
      >
        <h1 className="text-white text-5xl md:text-7xl font-bold drop-shadow-lg leading-tight">
          <span className="block">הדמויות שלכם.</span>
          <span className="block">על המדף שלכם.</span>
        </h1>
        <button
          onClick={() => setIsWizardOpen(true)}
          className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[#00b4d8] px-8 py-4 text-white font-semibold text-base shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#00a2c2]"
        >
          התחל בעיצוב אישי
        </button>
      </section>

      <section className="bg-[#111A2C] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-white">
              תהליך ההזמנה צעד אחר צעד
            </h2>
            <p className="text-slate-300">פשוט, ברור, ועם ליווי מלא עד התוצאה הסופית.</p>
          </div>

          {/* Desktop centered guided flow */}
          <div className="hidden lg:flex flex-row justify-center items-stretch gap-4">
            {ORDER_STEPS.map((step, index) => (
              <div key={step.title} className="flex items-center gap-4">
                <div className="w-[180px] xl:w-[200px] h-full flex flex-col items-stretch">
                  <div className="flex justify-center mb-3">
                    <span className="bg-cyan-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md shadow-cyan-900/30">
                      {step.step}
                    </span>
                  </div>
                  <article className="h-full bg-white rounded-2xl shadow-sm p-6 text-center border border-white/80 flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-900/20">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-3">
                      {step.icon}
                    </div>
                    <h3 className="font-bold text-base mb-2 text-slate-900">{step.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                  </article>
                </div>
                {index < ORDER_STEPS.length - 1 && (
                  <div className="text-slate-500">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile/Tablet centered grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:hidden items-stretch">
            {ORDER_STEPS.map((step) => (
              <div key={step.title} className="flex flex-col items-center h-full">
                <span className="bg-cyan-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-3 shadow-md shadow-cyan-900/30">
                  {step.step}
                </span>
                <article className="w-full h-full bg-white rounded-2xl shadow-sm p-6 text-center border border-white/80 flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-900/20">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-3">
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-base mb-2 text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="mb-8 md:mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">גלריית עבודות</h2>
            <p className="text-gray-600">דוגמאות למודלים מותאמים אישית מהסטודיו שלנו.</p>
          </div>

          <div className="relative px-10 sm:px-12 lg:px-14">
            <div
              ref={galleryScrollRef}
              dir="ltr"
              className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div
                className="flex gap-4"
              >
                {[...galleryImages, ...galleryImages, ...galleryImages].map((image, index) => (
                  <div
                    key={`${image.id}-${index}`}
                    data-gallery-card
                    className="shrink-0 w-full sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]"
                  >
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="aspect-[3/4] w-full bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-1 sm:-right-2 lg:-right-3 top-1/2 -translate-y-1/2">
                <button
                  onClick={() => scrollGallery('prev')}
                  className="pointer-events-auto h-11 w-11 rounded-full border border-gray-200 bg-white/95 text-gray-800 shadow-md hover:bg-white transition-colors"
                  aria-label="הקודם"
                >
                  ‹
                </button>
              </div>
              <div className="absolute -left-1 sm:-left-2 lg:-left-3 top-1/2 -translate-y-1/2">
                <button
                  onClick={() => scrollGallery('next')}
                  className="pointer-events-auto h-11 w-11 rounded-full border border-gray-200 bg-white/95 text-gray-800 shadow-md hover:bg-white transition-colors"
                  aria-label="הבא"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">שאלות נפוצות</h2>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {faqs.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={item.question} className="border-b border-gray-100 last:border-b-0">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-5 sm:px-6 py-5 flex items-center justify-between gap-4 text-right hover:bg-gray-50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base sm:text-lg font-semibold text-gray-900">{item.question}</span>
                    <span
                      className={`shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-cyan-600' : 'rotate-0 text-gray-400'
                      }`}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 sm:px-6 pb-5 text-sm sm:text-base text-gray-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-50 border border-slate-100 shadow-sm text-slate-700 font-medium">
              <span className="text-lg" aria-hidden>
                🇮🇱
              </span>
              מיוצר ומודפס בישראל
            </span>
          </div>

          <div className="max-w-5xl mx-auto rounded-3xl p-8 md:p-12 mb-20 bg-[#0B1320] text-center">
            <h3 className="text-white text-3xl font-bold mb-4">מודלו לעסקים</h3>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              מחפשים מתנה מקורית לעובדים, לצוות ההנהלה או ללקוחות? דברו איתנו על הזמנות מרוכזות ועיצובים מיוחדים לחברות.
            </p>
            <a
              href="https://wa.me/972500000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] px-7 py-3.5 text-white font-semibold transition-transform hover:scale-105"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.97-4.03 9-9 9a8.96 8.96 0 0 1-4.24-1.06L3 21l1.12-4.49A8.96 8.96 0 0 1 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9Z" />
              </svg>
              דברו איתנו בוואטסאפ
            </a>
          </div>
        </div>
      </section>

      {isWizardOpen && <PersonalWizard onClose={() => setIsWizardOpen(false)} />}
    </div>
  );
}

