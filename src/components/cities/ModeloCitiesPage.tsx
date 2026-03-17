'use client';

import Link from 'next/link';

const featuredCities = [
  { name: 'תל אביב', country: 'ישראל', imageSrc: '/images/cities/tel-aviv.jpeg' },
  { name: 'ניו יורק', country: 'ארצות הברית', imageSrc: '/images/cities/new-york.jpeg' },
  { name: 'לונדון', country: 'בריטניה', imageSrc: '/images/cities/london.jpeg' },
];

export default function ModeloCitiesPage() {
  return (
    <div className="bg-white text-slate-900" dir="rtl">
      {/* Hero */}
      <section className="relative w-full min-h-[75vh] md:h-[85vh] flex flex-col items-center justify-center overflow-hidden">
        <div
          className="bg-cover bg-center bg-no-repeat absolute inset-0"
          style={{ backgroundImage: "url('/images/cities/city.jpeg')" }}
        />
        <div className="absolute inset-0 bg-black/40 z-10" />

        <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-white text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-lg mb-6">
            הערים האהובות עליכם. בתלת־ממד.
          </h1>
          <p className="text-white/95 text-lg md:text-2xl font-medium drop-shadow-md mb-10">
            אמנות אדריכלית מודפסת, שמביאה את קו הרקיע ישר אליכם הביתה.
          </p>
          <Link
            href="/cities/product"
            className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 shadow-xl hover:bg-gray-100"
          >
            גלו את הקולקציה
          </Link>
        </div>
      </section>

      {/* Featured Cities */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">קולקציית הערים</h2>
            <p className="text-slate-600">
              סדרת מודלים מינימליסטיים בהשראת ערים אייקוניות בעולם.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCities.map((city) => (
              <article key={city.name}>
                <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={city.imageSrc}
                    alt={`מודל תלת־ממדי של ${city.name}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="pt-4 text-center">
                  <h3 className="text-xl font-bold text-slate-900">{city.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{city.country}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Custom City Banner */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">לא מצאתם את העיר שלכם?</h2>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-3xl mx-auto mb-8">
              שלחו לנו נ.צ או כתובת, ואנחנו נייצר עבורכם מודל טופוגרפי ואדריכלי מדויק של כל מקום בעולם.
            </p>
            <button className="inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-8 py-3 font-semibold hover:bg-slate-100 transition-colors">
              הזמינו עיר בהתאמה אישית
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

