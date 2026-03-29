'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Building2, Medal, ShoppingBag, User, UserCircle } from 'lucide-react';
import { useCartStore } from '@/lib/store';

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
  }

  const deptNavClass = (isActive: boolean) =>
    [
      'flex flex-col items-center justify-center text-center transition-colors',
      isActive
        ? 'text-black font-extrabold text-lg'
        : 'text-slate-700 hover:text-black font-medium text-lg',
    ].join(' ');

  const deptIconClass = (isActive: boolean) =>
    `mb-1 h-4 w-4 shrink-0 font-light ${isActive ? 'opacity-90' : 'opacity-70'}`;

  return (
    <>
      <header className="relative z-50 w-full bg-white border-b border-slate-200/70" dir="rtl">
        <div className="flex justify-between items-center w-full h-24 max-w-7xl mx-auto px-6">
          {/* Right (RTL): Logo */}
          <div className="hidden md:flex shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src={logoSrc}
                alt="Modelo"
                width={240}
                height={76}
                priority
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Center: Department navigation */}
          <nav className="hidden md:flex items-center gap-10">
            {/* TODO: Restore Studio page later — set the condition below to true or replace with the Link. */}
            {false && (
              <Link href="/studio" className={deptNavClass(pathname.includes('/studio'))}>
                סטודיו
              </Link>
            )}
            <Link href="/personal" className={deptNavClass(pathname.includes('/personal'))}>
              <User className={deptIconClass(pathname.includes('/personal'))} strokeWidth={1.5} />
              פרסונל
            </Link>
            <Link href="/cities" className={deptNavClass(pathname.includes('/cities'))}>
              <Building2 className={deptIconClass(pathname.includes('/cities'))} strokeWidth={1.5} />
              סיטיז
            </Link>
            <Link href="/sport" className={deptNavClass(pathname.includes('/sport'))}>
              <Medal className={deptIconClass(pathname.includes('/sport'))} strokeWidth={1.5} />
              ספורט
            </Link>
          </nav>

          {/* Left (RTL): Profile + Cart */}
          <div className="hidden md:flex items-center gap-6 shrink-0">
            <Link
              href="/profile"
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-100 transition-all"
              aria-label="אזור אישי"
            >
              <UserCircle className="w-5 h-5 text-slate-400 hover:text-black transition-colors" strokeWidth={1.8} />
            </Link>
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-100 transition-all"
              aria-label="סל קניות"
            >
              <ShoppingBag className="w-5 h-5 text-slate-400 hover:text-black transition-colors" strokeWidth={1.8} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -start-0.5 bg-black text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex w-full items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src={logoSrc}
                alt="Modelo"
                width={180}
                height={56}
                priority
                className="h-10 w-auto object-contain"
              />
            </Link>

            <div className="flex items-center gap-1">
              <Link
                href="/profile"
                className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-100 transition-all"
                aria-label="אזור אישי"
              >
                <UserCircle className="w-5 h-5 text-slate-400" strokeWidth={1.8} />
              </Link>
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-100 transition-all"
                aria-label="סל קניות"
              >
                <ShoppingBag className="w-5 h-5 text-slate-400" strokeWidth={1.8} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -start-0.5 bg-black text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-100 transition-colors"
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

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" dir="rtl">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <nav className="absolute top-24 right-0 left-0 bg-white border-b border-slate-200 shadow-xl">
            <div className="max-w-7xl mx-auto px-5 py-5 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {[
                  // TODO: Restore Studio page later — { href: '/studio', label: 'סטודיו', Icon: ... },
                  { href: '/personal', label: 'פרסונל', Icon: User },
                  { href: '/cities', label: 'סיטיז', Icon: Building2 },
                  { href: '/sport', label: 'ספורט', Icon: Medal },
                ].map((d) => {
                  const active = pathname.includes(d.href);
                  const Icon = d.Icon;
                  return (
                    <Link
                      key={d.href}
                      href={d.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-3 rounded-xl text-xs font-semibold transition-colors ${
                        active ? 'bg-black text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 font-light ${active ? 'opacity-95' : 'opacity-70'}`}
                        strokeWidth={1.5}
                      />
                      {d.label}
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1">
                {[
                  { href: '/', label: 'עמוד הבית' },
                  { href: '/about', label: 'אודות' },
                  { href: '/contact', label: 'צור קשר' },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
