import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 py-8 mt-auto bg-white" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex items-center justify-center gap-6 text-sm mb-4">
          <Link href="/terms" className="text-slate-500 hover:text-black transition-colors">
            תקנון ומדיניות פרטיות
          </Link>
          <Link href="/accessibility" className="text-slate-500 hover:text-black transition-colors">
            הצהרת נגישות
          </Link>
        </div>
        <p className="text-sm text-slate-500">© 2026 Modelo. כל הזכויות שמורות.</p>
      </div>
    </footer>
  );
}
