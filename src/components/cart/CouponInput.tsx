'use client';

import { useMemo, useState } from 'react';
import { Tag, X } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { computeDiscountAmount } from '@/lib/store/cart-discount';

type Props = {
  className?: string;
  /** Smaller padding for the slide-out drawer. */
  compact?: boolean;
};

export function CouponInput({ className = '', compact = false }: Props) {
  const subtotal = useCartStore((s) => s.subtotal);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const discountAmount = useMemo(
    () => computeDiscountAmount(subtotal, appliedCoupon),
    [subtotal, appliedCoupon],
  );

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputCls = compact
    ? 'flex-1 min-w-0 rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15'
    : 'flex-1 min-w-0 rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15';

  const handleApply = async () => {
    setError(null);
    setLoading(true);
    try {
      await applyCoupon(code);
      setCode('');
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'קופון לא חוקי או פג תוקף';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {appliedCoupon ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5">
          <Tag className="h-4 w-4 shrink-0 text-emerald-700" strokeWidth={2} />
          <span className="text-xs font-bold text-emerald-900">קופון הופעל</span>
          <span className="text-xs font-mono font-semibold text-emerald-800">{appliedCoupon.code}</span>
          <span className="text-sm font-bold text-red-600 tabular-nums" dir="ltr">
            −₪{discountAmount}
          </span>
          <button
            type="button"
            onClick={() => {
              removeCoupon();
              setError(null);
            }}
            className="ms-auto flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-900"
            aria-label="הסר קופון"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <div className={`flex gap-2 ${compact ? 'flex-col sm:flex-row' : ''}`}>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleApply();
            }}
            placeholder="הזן קוד קופון"
            className={inputCls}
            disabled={loading}
            autoComplete="off"
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={loading}
            className={`shrink-0 rounded-xl bg-slate-900 px-4 font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 ${
              compact ? 'py-2.5 text-sm' : 'py-3 text-sm'
            }`}
          >
            {loading ? '…' : 'הפעל'}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
