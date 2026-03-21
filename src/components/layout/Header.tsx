'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Trophy } from 'lucide-react';
import { useCartStore } from '@/lib/store';

interface DepartmentLogoLinkProps {
  href: string;
  label: 'cities' | 'personal' | 'studio' | 'sports';
  isActive: boolean;
}

function DepartmentLogoLink({ href, label, isActive }: DepartmentLogoLinkProps) {
  const activeCls = isActive ? 'text-cyan-600' : 'text-slate-600';

  return (
    <Link
      href={href}
      className={`group inline-flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-xl transition-all hover:text-cyan-600 ${activeCls}`}
      aria-label={label}
    >
      {label === 'cities' && (
        <div className="w-10 h-10 flex items-center justify-center mb-1">
          <svg className="w-full h-full object-contain" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M4 26H28" strokeLinecap="round" />
            <rect x="6" y="16" width="4" height="10" rx="1" />
            <rect x="12.5" y="11" width="5" height="15" rx="1" />
            <rect x="20" y="14" width="6" height="12" rx="1" />
            <path d="M14.5 14.5H15.5M14.5 17.5H15.5M21.5 17H24.5M21.5 20H24.5" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {label === 'personal' && (
        <div className="w-10 h-10 flex items-center justify-center mb-1">
          <svg className="w-full h-full object-contain" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="16" cy="9" r="4" />
            <path d="M9.5 26V21.5C9.5 17.9 12.4 15 16 15C19.6 15 22.5 17.9 22.5 21.5V26" strokeLinecap="round" />
            <path d="M12 26H20" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {label === 'studio' && (
        <div className="w-10 h-10 flex items-center justify-center mb-1">
          <svg className="w-full h-full object-contain" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M7 22L16 17L25 22L16 27L7 22Z" />
            <path d="M12 13L20 5L23 8L15 16L11 17L12 13Z" />
            <path d="M20 5L23 8" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {label === 'sports' && (
        <div className="w-10 h-10 flex items-center justify-center mb-1">
          <Trophy size={32} strokeWidth={1.5} />
        </div>
      )}

      <span className="text-[11px] font-semibold tracking-wide lowercase">{label}</span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname() || '';
  const totalItems = useCartStore((s) => s.totalItems);
  const [mobileOpen, setMobileOpen] = useState(false);

  let logoSrc = '/images/logo/main.jpeg';
  if (pathname.includes('/personal')) {
    logoSrc = '/images/logo/personal.jpeg';
  } else if (pathname.includes('/cities')) {
    logoSrc = '/images/logo/cities.jpeg';
  } else if (pathname.includes('/sport')) {
    logoSrc = '/images/logo/sport.jpeg';
  } else if (pathname.includes('/studio')) {
    logoSrc = '/images/logo/studio.jpeg';
  } else if (pathname.includes('/cart') || pathname.includes('/checkout') || pathname === '/') {
    logoSrc = '/images/logo/main.jpeg';
  }

  const departmentLinkClass = (isActive: boolean) =>
    isActive
      ? 'text-black font-extrabold text-lg'
      : 'text-slate-500 hover:text-black font-medium text-lg transition-colors';

  return (
    <>
      <header className="relative z-50 w-full bg-white border-b border-border/60" dir="rtl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative h-24 flex justify-between items-center w-full">
            {/* Right: Logo */}
            <div className="hidden md:flex min-w-[220px] justify-end">
              <Link href="/" className="flex items-center group">
                <Image
                  src={logoSrc}
                  alt="Modelo Logo"
                  width={240}
                  height={76}
                  priority
                  className="h-12 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Center: Department text navigation */}
            <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
              <Link
                href="/studio"
                className={departmentLinkClass(pathname.includes('/studio'))}
              >
                סטודיו
              </Link>
              <Link
                href="/personal"
                className={departmentLinkClass(pathname.includes('/personal'))}
              >
                פרסונל
              </Link>
              <Link
                href="/cities"
                className={departmentLinkClass(pathname.includes('/cities'))}
              >
                סיטיז
              </Link>
              <Link
                href="/sport"
                className={departmentLinkClass(pathname.includes('/sport'))}
              >
                ספורט
              </Link>
            </nav>

            {/* Left: utility links + cart */}
            <div className="hidden md:flex items-center gap-6 min-w-[340px] justify-start">
              <Link href="/" className="text-sm font-medium text-slate-500 hover:text-black transition-colors">
                עמוד הבית
              </Link>
              <Link href="/about" className="text-sm font-medium text-slate-500 hover:text-black transition-colors">
                אודות
              </Link>
              <Link href="/contact" className="text-sm font-medium text-slate-500 hover:text-black transition-colors">
                צור קשר
              </Link>
              <Link
                href="/cart"
                className="relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-muted-bg transition-all group"
              >
                <ShoppingBag className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" strokeWidth={1.8} />
                <span className="hidden sm:inline text-muted group-hover:text-foreground transition-colors">סל</span>
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -start-0.5 bg-black text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile: logo + menu/cart */}
            <div className="md:hidden flex w-full items-center justify-between">
              <Link href="/" className="flex items-center group">
                <Image
                  src={logoSrc}
                  alt="Modelo Logo"
                  width={180}
                  height={56}
                  priority
                  className="h-10 w-auto object-contain"
                />
              </Link>

              <div className="flex items-center gap-1">
                <Link
                  href="/cart"
                  className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted-bg transition-all"
                  aria-label="סל קניות"
                >
                  <ShoppingBag className="w-5 h-5 text-muted" strokeWidth={1.8} />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -start-0.5 bg-black text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            <div className="md:hidden absolute left-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted-bg transition-colors"
                aria-label="תפריט"
              >
                {mobileOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <nav className="absolute top-16 right-0 left-0 bg-white border-b border-border shadow-xl animate-fade-in-fast">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center px-3 py-2 rounded-xl text-foreground bg-muted-bg text-sm font-medium"
                >
                  בית
                </Link>
                <Link
                  href="/studio"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center px-3 py-2 rounded-xl text-foreground bg-primary/10 text-sm font-medium"
                >
                  מודלו סטודיו
                </Link>
                <Link
                  href="/personal"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center px-3 py-2 rounded-xl text-foreground bg-muted-bg text-sm font-medium"
                >
                  מודלו פרסונל
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center px-3 py-2 rounded-xl text-foreground bg-muted-bg text-sm font-medium"
                >
                  אודות
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center px-3 py-2 rounded-xl text-foreground bg-muted-bg text-sm font-medium"
                >
                  צור קשר
                </Link>
                <Link
                  href="/sport"
                  onClick={() => setMobileOpen(false)}
                  className="col-span-2 flex items-center justify-center px-3 py-2 rounded-xl text-foreground bg-muted-bg text-sm font-medium"
                >
                  מודלו ספורטס
                </Link>
                <Link
                  href="/cities"
                  onClick={() => setMobileOpen(false)}
                  className="col-span-2 flex items-center justify-center px-3 py-2 rounded-xl text-foreground bg-muted-bg text-sm font-medium"
                >
                  מודלו סיטיז
                </Link>
              </div>
              <Link
                href="/cart"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted-bg transition-colors"
              >
                <ShoppingBag className="w-5 h-5 text-muted" strokeWidth={1.8} />
                <span className="font-medium">סל קניות</span>
                {totalItems > 0 && <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">{totalItems}</span>}
              </Link>
              <Link
                href="/studio/order/track"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted-bg transition-colors"
              >
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <span className="font-medium">מעקב הזמנה</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
