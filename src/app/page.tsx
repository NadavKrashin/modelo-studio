import Image from "next/image";
import Link from "next/link";

function PremiumCta({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center bg-black text-white px-8 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 shadow-xl hover:bg-slate-800"
    >
      {label}
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="bg-white text-slate-900 font-sans" dir="rtl">
      <section
        className="relative min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/image_0.png'), url('/0.jpeg')" }}
      >
        <div className="absolute inset-0 bg-white/55" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center justify-center text-center">
            <div className="max-w-5xl">
              <h1 className="text-black text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight drop-shadow-xl leading-tight">
                מודלו. העתיד של האדריכלות המודפסת.
              </h1>
              <div className="mt-10">
                <Link
                  href="/cities"
                  className="inline-flex items-center justify-center bg-black text-white px-12 py-5 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-2xl hover:bg-slate-800"
                >
                  חקור את העולמות שלנו
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="hidden md:block pointer-events-none absolute inset-y-2 right-1/3 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
            <div className="hidden md:block pointer-events-none absolute inset-y-2 right-2/3 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />

            <article>
              <div className="w-full h-auto aspect-[16/10] bg-[#F8F9FA] rounded-2xl flex items-center justify-center overflow-hidden mb-4 relative">
                <Image
                  src="/images/1.jpeg"
                  alt="Modelo Personal"
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="font-extrabold text-3xl mb-4">מודלו פרסונל.</h2>
              <p className="text-slate-600 mb-7 leading-relaxed">
                עיצוב והדפסת מודלים אישיים מכל סוג. דמויות, פסלים, ועוד.
              </p>
              <PremiumCta href="/personal" label="התחל לעצב" />
            </article>

            <article>
              <div className="w-full h-auto aspect-[16/10] bg-[#F8F9FA] rounded-2xl flex items-center justify-center overflow-hidden mb-4 relative">
                <Image
                  src="/0.jpeg"
                  alt="Modelo Cities"
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="font-extrabold text-3xl mb-4">מודלו סיטיז.</h2>
              <p className="text-slate-600 mb-7 leading-relaxed">
                אמנות אדריכלית מודפסת, שמביאה את קו הרקיע ישר אליכם הביתה.
              </p>
              <PremiumCta href="/cities" label="גלו את הקולקציה" />
            </article>

            <article>
              <div className="w-full h-auto aspect-[16/10] bg-[#F8F9FA] rounded-2xl flex items-center justify-center overflow-hidden mb-4 relative">
                <Image
                  src="/hero-figurine.png"
                  alt="Modelo Studio"
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="font-extrabold text-3xl mb-4">מודלו סטודיו.</h2>
              <p className="text-slate-600 mb-7 leading-relaxed">
                הפלטפורמה המובילה בארץ להדפסות תלת־ממד. מודלים נבחרים בקוד פתוח.
              </p>
              <PremiumCta href="/studio" label="חקור פרויקטים" />
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
