'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/pricing';
import type { FilamentOption } from '@/lib/types';

export default function CartPage() {
  const { items, subtotal, totalItems } = useCartStore();
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const [filamentOptions, setFilamentOptions] = useState<FilamentOption[]>([]);

  useEffect(() => {
    fetch('/api/filaments')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: FilamentOption[]) => setFilamentOptions(Array.isArray(data) ? data : []))
      .catch(() => setFilamentOptions([]));
  }, []);

  const getFilamentColor = (filamentId: string) =>
    filamentOptions.find((f) => f.id === filamentId);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center animate-fade-in">
        <div className="w-24 h-24 bg-muted-bg rounded-3xl mx-auto mb-6 flex items-center justify-center">
          <svg className="w-12 h-12 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">הסל ריק</h2>
        <p className="text-muted mb-8 max-w-xs mx-auto">עדיין לא הוספתם מודלים לסל. התחילו לחפש ולהוסיף מודלים.</p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-7 py-3.5 rounded-2xl font-semibold transition-all shadow-lg shadow-primary/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          חיפוש מודלים
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-foreground">
          סל קניות
          <span className="text-base font-medium text-muted mr-2">({totalItems} פריטים)</span>
        </h1>
        <Link href="/search" className="text-sm text-primary hover:underline font-medium">
          המשיכו לחפש
        </Link>
      </div>

      <div className="space-y-4 mb-8">
        {items.map((item) => {
          const filament = getFilamentColor(item.customization.filamentId);
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-border/80 p-4 md:p-5 flex gap-4 md:gap-5 hover:shadow-sm transition-shadow"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 bg-muted-bg rounded-xl shrink-0 flex items-center justify-center relative overflow-hidden">
                {item.thumbnailUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.thumbnailUrl}
                    alt={item.localizedModelName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-10 h-10 text-muted/30" viewBox="0 0 64 64" fill="none">
                    <path d="M32 12L50 22V42L32 52L14 42V22L32 12Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                )}
                {filament && (
                  <div
                    className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: filament.colorHex }}
                    title={filament.localizedName}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/model/${item.modelId}`} className="font-bold text-foreground hover:text-primary transition-colors text-sm md:text-base">
                        {item.localizedModelName}
                      </Link>
                      {item.sourceName && item.sourceName !== 'Modelo' && (
                        <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                          {item.sourceName}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted">
                      <span dir="ltr">
                        {item.customization.dimensions.widthMm}×{item.customization.dimensions.heightMm}×{item.customization.dimensions.depthMm}mm
                      </span>
                      {filament && <span>{filament.localizedName}</span>}
                      {item.customization.embossedText && (
                        <span>טקסט: &ldquo;{item.customization.embossedText}&rdquo;</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted hover:text-error p-1 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                    title="הסרה מהסל"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3 md:mt-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-sm hover:bg-muted-bg active:scale-95 transition-all"
                    >
                      −
                    </button>
                    <span className="font-bold min-w-[2.5ch] text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-sm hover:bg-muted-bg active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-extrabold text-primary text-base">{formatPrice(item.subtotal)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-border/80 p-6 mb-4">
        <div className="flex justify-between items-baseline">
          <span className="font-bold text-foreground">סה&quot;כ</span>
          <div className="text-end">
            <span className="text-2xl font-extrabold text-primary">{formatPrice(subtotal)}</span>
            <p className="text-[11px] text-muted mt-0.5">לפני משלוח</p>
          </div>
        </div>
      </div>

      <Link
        href="/checkout"
        className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover active:scale-[0.99] text-white py-4 rounded-2xl font-bold text-[17px] transition-all shadow-xl shadow-primary/25"
      >
        המשך לתשלום
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </Link>
    </div>
  );
}
