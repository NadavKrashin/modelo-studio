import Link from 'next/link';
import { CreditCard, Mail, MessageCircle } from 'lucide-react';

const INFO_LINKS = [
  { href: '/about', label: 'אודות' },
  { href: '/accessibility', label: 'נגישות' },
];

const LEGAL_LINKS = [
  { href: '/terms', label: 'תקנון ומדיניות פרטיות' },
];

/** Minimal monochrome Apple mark for footer badge */
function AppleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.17 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.65 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-100 pt-16 pb-10 mt-24" dir="rtl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">Modelo</p>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-xs">
              הדפסת תלת מימד בהזמנה אישית.
              <br />
              עיצוב, התאמה והדפסה — הכל במקום אחד.
            </p>
          </div>

          {/* מידע */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">מידע</h3>
            <ul className="space-y-3">
              {INFO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-black transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* משפטי */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">משפטי</h3>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-black transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* צור קשר */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">צור קשר</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:modeloo.info@gmail.com"
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-black transition-colors"
                >
                  <Mail className="w-4 h-4" strokeWidth={1.6} />
                  modeloo.info@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/972552745188"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-black transition-colors"
                >
                  <MessageCircle className="w-4 h-4" strokeWidth={1.6} />
                  וואטסאפ
                </a>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-slate-500 hover:text-black transition-colors"
                >
                  פנייה לעסקים (B2B)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright & trust */}
        <div className="mt-14 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-center sm:text-start">
            <p className="text-sm text-slate-400">© 2026 Modelo. כל הזכויות שמורות.</p>
            <span className="text-slate-500 text-sm">🇮🇱 מיוצר בישראל</span>
          </div>

          <div
            className="flex flex-wrap justify-center gap-3 items-center opacity-70"
            aria-label="אמצעי תשלום נתמכים"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
              <CreditCard className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
              כרטיס אשראי
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
              <AppleMark className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
              Apple&nbsp;Pay
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
              <span
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-slate-400 text-[9px] font-bold leading-none text-slate-500"
                aria-hidden
              >
                G
              </span>
              Google&nbsp;Pay
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
