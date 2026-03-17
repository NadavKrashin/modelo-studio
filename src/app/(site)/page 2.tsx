import Link from 'next/link';

export default function ModeloHomePage() {
  return (
    <>
      {/* HERO — minimalist clean section */}
      <section className="bg-cyan-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center py-20 md:py-28">
          <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-8" dir="rtl">
            הפלטפורמה המובילה בארץ להדפסות תלת מימד
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/studio"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gray-900 text-white text-base font-semibold shadow-lg shadow-gray-900/20 hover:bg-black transition-colors"
            >
              Modelo Studio
            </Link>
            <Link
              href="/personal"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl border-2 border-gray-800 text-gray-900 text-base font-semibold bg-white/90 backdrop-blur-sm hover:bg-white hover:border-black transition-colors"
            >
              Modelo Personal
            </Link>
          </div>
        </div>
      </section>

      {/* TWO EXPERIENCES */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
              Two ways to print with Modelo
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              Choose from a catalog of ready‑to‑print designs or create something completely personal.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Modelo Studio */}
            <div className="group rounded-3xl border border-gray-200 bg-white p-6 md:p-7 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Modelo Studio</h3>
              <p className="text-sm text-gray-600 mb-5">
                Browse thousands of ready-to-print 3D models. Customize size and color and order instantly.
              </p>
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 bg-gray-900/5 hover:bg-gray-900/10 rounded-2xl px-4 py-2 transition-colors"
              >
                Explore Studio
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Modelo Personal */}
            <div className="group rounded-3xl border border-dashed border-gray-200 bg-white p-6 md:p-7">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Modelo Personal</h3>
              <p className="text-sm text-gray-600 mb-5">
                Turn yourself or your ideas into a custom 3D printed figure.
              </p>
              <button
                disabled
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 bg-gray-100 rounded-2xl px-4 py-2 cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

