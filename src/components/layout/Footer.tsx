import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo.png"
                alt="Modelo"
                width={220}
                height={68}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              פלטפורמת הדפסת תלת מימד מובילה בישראל. מצאו מודלים, התאימו אישית והזמינו הדפסה באיכות גבוהה.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">שירותים</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/search" className="hover:text-white transition-colors">חיפוש מודלים</Link></li>
              <li><Link href="/search?category=home-decor" className="hover:text-white transition-colors">עיצוב הבית</Link></li>
              <li><Link href="/search?category=gadgets" className="hover:text-white transition-colors">גאדג׳טים וכלים</Link></li>
              <li><Link href="/search?category=gifts" className="hover:text-white transition-colors">מתנות אישיות</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">לקוחות</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/cart" className="hover:text-white transition-colors">סל קניות</Link></li>
              <li><Link href="/order/track" className="hover:text-white transition-colors">מעקב הזמנה</Link></li>
              <li><Link href="/search?category=toys" className="hover:text-white transition-colors">צעצועים ומשחקים</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">יצירת קשר</h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <span dir="ltr">modeloo.info@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                <span dir="ltr">055-274-5188</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                ישראל
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <span>&copy; {new Date().getFullYear()} Modelo. כל הזכויות שמורות.</span>
          <div className="flex items-center gap-4">
            <span>הדפסת 3D בישראל</span>
            <span>•</span>
            <span>PLA • PETG • ABS • TPU</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
