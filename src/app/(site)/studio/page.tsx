import Link from 'next/link';
import { FILAMENT_OPTIONS } from '@/lib/constants/filaments';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { getSearchService, getCategoryRepo } from '@/lib/services/container';

export default async function StudioHomePage() {
  const searchService = getSearchService();
  const categoryRepo = getCategoryRepo();

  const popularModels = await searchService.getPopular(8);
  const activeCategories = await categoryRepo.findActive();
  const popularFilaments = FILAMENT_OPTIONS.filter((f) => f.inStock).slice(0, 12);

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-blue-600 via-primary to-indigo-700">
        {/* Decorative geometry */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[480px] h-[480px] bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        {/* Main hero photo (desktop) */}
        <div
          className="hidden lg:block absolute left-0 xl:left-6 top-1/2 -translate-y-1/2 pointer-events-none select-none"
          aria-hidden
        >
          <div className="relative w-[260px] xl:w-[300px]">
            <div className="absolute inset-0 bg-black/20 blur-3xl rounded-full translate-y-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-figurine.png"
              alt="מודל תלת מימדי מודפס"
              className="relative w-full h-auto drop-shadow-2xl"
              loading="lazy"
            />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-2xl lg:max-w-3xl ml-auto lg:ml-[320px]">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-blue-100 text-xs font-medium px-3.5 py-1.5 rounded-full mb-6 border border-white/10">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              אלפי מודלים זמינים להדפסה
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] mb-5 tracking-tight">
              Modelo Studio
            </h1>
            <p className="text-base sm:text-lg text-blue-100/90 mb-9 leading-relaxed max-w-xl">
              Browse thousands of ready‑to‑print 3D models, customize size and color, and order high‑quality 3D prints delivered to your door.
            </p>

            {/* Search Bar */}
            <form action="/studio/search" method="GET">
              <div className="max-w-2xl">
                <div
                  dir="rtl"
                  className="flex items-center gap-1.5 rounded-2xl bg-white p-1.5 shadow-2xl shadow-black/20 ring-1 ring-white/25 transition-all focus-within:ring-2 focus-within:ring-cyan-200/70"
                >
                  <button
                    type="submit"
                    className="shrink-0 h-10 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-all shadow-md shadow-primary/25"
                  >
                    חיפוש
                  </button>

                  <div className="flex items-center gap-3 flex-1 px-4">
                    <input
                      type="search"
                      name="q"
                      placeholder='חפשו מודל... למשל: "דרקון", "מעמד טלפון", "עציץ"'
                      className="flex-1 py-3.5 text-right text-gray-900 placeholder-gray-400 text-[15px] outline-none bg-transparent"
                      dir="rtl"
                      autoComplete="off"
                    />
                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </form>

            {/* Quick suggestions */}
            <div className="flex flex-wrap items-center gap-2 mt-5">
              <span className="text-blue-200/60 text-xs">פופולרי:</span>
              {['דרקון', 'מעמד טלפון', 'עציץ', 'מחזיק מפתחות', 'אהיל'].map((term) => (
                <Link
                  key={term}
                  href={`/studio/search?q=${encodeURIComponent(term)}`}
                  className="text-xs text-blue-100 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors border border-white/10"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-muted">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              <span>הדפסה באיכות גבוהה</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <span>משלוח או איסוף עצמי</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
              </svg>
              <span>התאמה אישית לכל מודל</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
              <span>אלפי מודלים ממקורות מובילים</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">גלו לפי קטגוריה</h2>
          <p className="text-muted text-sm md:text-base">מודלים מאורגנים לפי תחומי עניין</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {activeCategories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/studio/search?category=${cat.slug}`}
              className={`group flex flex-col items-center gap-3 bg-white rounded-2xl border border-border/80 p-5 md:p-6 text-center hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-200 animate-fade-in stagger-${Math.min(i + 1, 8)}`}
            >
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200">
                <CategoryIcon iconName={cat.iconName} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm leading-tight">{cat.localizedName}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── POPULAR MODELS ─── */}
      <section className="bg-gradient-to-b from-muted-bg/50 to-muted-bg py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb  -10 md:mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-1.5">הכי פופולריים</h2>
              <p className="text-muted text-sm md:text-base">המודלים שהכי מזמינים השבוע</p>
            </div>
            <Link
              href="/studio/search"
              className="hidden sm:inline-flex items-center gap-1.5 text-primary hover:text-primary-hover font-semibold text-sm transition-colors"
            >
              כל המודלים
              <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {popularModels.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {popularModels.map((model, i) => (
                <Link
                  key={model.id}
                  href={`/studio/model/${model.id}`}
                  className={`group bg-white rounded-2xl border border-border/80 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 animate-fade-in stagger-${Math.min(i + 1, 8)}`}
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-muted-bg">
                    {model.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={model.thumbnailUrl}
                        alt={model.localizedName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="text-[10px] font-medium bg-white/90 backdrop-blur-sm text-muted px-2 py-1 rounded-md shadow-sm">
                        {model.sourceName}
                      </span>
                    </div>
                  </div>
                  <div className="p-3.5 md:p-4">
                    <h3 className="font-bold text-foreground text-sm leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-1" dir="auto">
                      {model.localizedName}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted">החל מ-</span>
                        <span className="text-primary font-extrabold text-sm mr-0.5">₪{model.estimatedBasePrice}</span>
                      </div>
                      <span className="text-[11px] bg-primary-50 text-primary px-2.5 py-1 rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        לפרטים
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-border/80">
              <svg className="w-16 h-16 text-muted/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <h3 className="text-lg font-bold text-foreground mb-2">חפשו מודלים מהמקורות המובילים</h3>
              <p className="text-muted text-sm mb-6 max-w-md mx-auto">השתמשו בחיפוש כדי לגלות אלפי מודלים תלת מימדיים מ-Thingiverse, MyMiniFactory ועוד</p>
              <Link
                href="/studio/search"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                חיפוש מודלים
              </Link>
            </div>
          )}

          {popularModels.length > 0 && (
            <div className="sm:hidden text-center mt-8">
              <Link
                href="/studio/search"
                className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm"
              >
                כל המודלים
                <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">איך זה עובד?</h2>
          <p className="text-muted text-sm md:text-base">שלושה צעדים פשוטים מהחיפוש להדפסה</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {[
            {
              step: '01',
              title: 'חפשו מודל',
              desc: 'גלו מודלים ממגוון מקורות מובילים. חפשו בעברית או באנגלית ומצאו בדיוק את מה שאתם מחפשים.',
            },
            {
              step: '02',
              title: 'התאימו אישית',
              desc: 'בחרו צבע ממגוון פילמנטים, שנו גודל, הוסיפו טקסט בולט, צרפו הערות או תמונות ייחוס.',
            },
            {
              step: '03',
              title: 'קבלו עד הבית',
              desc: 'השלימו את ההזמנה כאורחים, ללא צורך בהרשמה. קבלו את המודל המודפס עד הבית או באיסוף עצמי.',
            },
          ].map((item) => (
            <div key={item.step} className="text-center group">
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform" />
                <div className="relative bg-primary text-white rounded-2xl w-full h-full flex items-center justify-center">
                  <span className="text-lg font-semibold">{item.step}</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FILAMENT COLORS ─── */}
      <section className="bg-white border-y border-border py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb  -10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">צבעים וחומרים</h2>
            <p className="text-muted text-sm md:text-base">מגוון רחב של צבעי פילמנט וחומרי הדפסה</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-4 max-w-2xl mx-auto">
            {popularFilaments.map((f) => (
              <div key={f.id} className="flex flex-col items-center gap-2 group">
                <div
                  className={`w-11 h-11 md:w-12 md:h-12 rounded-full shadow-md group-hover:scale-110 transition-transform duration-200 ${f.colorHex === '#FFFFFF' || f.colorHex === '#F5F5F5' ? 'border-2 border-gray-200' : 'border-2 border-white'}`}
                  style={{ backgroundColor: f.colorHex }}
                />
                <span className="text-[11px] text-muted font-medium">{f.localizedColorName}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted mt-8">
            PLA • PETG • ABS • TPU — חומרים נוספים זמינים לפי דרישה
          </p>
        </div>
      </section>
    </>
  );
}

