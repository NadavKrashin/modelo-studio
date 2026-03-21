import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';

const INFO_LINKS = [
  { href: '/about', label: 'אודות' },
  { href: '/accessibility', label: 'נגישות' },
];

const LEGAL_LINKS = [
  { href: '/terms', label: 'תקנון ומדיניות פרטיות' },
];

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
                  href="https://wa.me/972501234567"
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

        {/* Copyright */}
        <div className="mt-14 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-400">© 2026 Modelo. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>
  );
}
