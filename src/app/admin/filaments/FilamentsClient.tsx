'use client';

import { useState, useMemo } from 'react';
import type { Filament, FilamentMaterial } from '@/lib/types';

const MATERIALS: FilamentMaterial[] = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon', 'Resin'];

const MATERIAL_COLORS: Record<FilamentMaterial, string> = {
  PLA: 'bg-blue-100 text-blue-700',
  PETG: 'bg-green-100 text-green-700',
  ABS: 'bg-red-100 text-red-700',
  TPU: 'bg-purple-100 text-purple-700',
  Nylon: 'bg-cyan-100 text-cyan-700',
  Resin: 'bg-amber-100 text-amber-700',
};

interface Props {
  initialFilaments: Filament[];
}

export function FilamentsClient({ initialFilaments }: Props) {
  const [filaments, setFilaments] = useState(initialFilaments);
  const [filterMaterial, setFilterMaterial] = useState<FilamentMaterial | ''>('');
  const [filterStock, setFilterStock] = useState<'all' | 'in_stock' | 'low' | 'out'>('all');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = filaments;
    if (filterMaterial) result = result.filter((f) => f.material === filterMaterial);
    if (filterStock === 'in_stock') result = result.filter((f) => f.inStock);
    if (filterStock === 'out') result = result.filter((f) => !f.inStock);
    if (filterStock === 'low') result = result.filter((f) => f.inStock && f.stockGrams <= f.minStockThreshold * 1.5);
    return result;
  }, [filaments, filterMaterial, filterStock]);

  const stats = useMemo(() => ({
    total: filaments.length,
    active: filaments.filter((f) => f.isActive).length,
    inStock: filaments.filter((f) => f.inStock).length,
    lowStock: filaments.filter((f) => f.inStock && f.stockGrams <= f.minStockThreshold * 1.5).length,
  }), [filaments]);

  async function toggleActive(id: string, currentActive: boolean) {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/filaments/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        setFilaments((prev) =>
          prev.map((f) => (f.id === id ? { ...f, isActive: !currentActive, updatedAt: new Date().toISOString() } : f))
        );
      }
    } catch { /* optimistic update already applied */ }
    setLoading(null);
  }

  async function updateStock(id: string) {
    const grams = parseInt(stockValue);
    if (isNaN(grams) || grams < 0) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/filaments/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockGrams: grams }),
      });
      if (res.ok) {
        setFilaments((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, stockGrams: grams, inStock: grams > f.minStockThreshold, updatedAt: new Date().toISOString() } : f
          )
        );
      }
    } catch { /* keep local state */ }
    setEditingStock(null);
    setStockValue('');
    setLoading(null);
  }

  function stockLevel(f: Filament) {
    if (!f.inStock) return { label: 'אזל', cls: 'text-error', bg: 'bg-red-50' };
    if (f.stockGrams <= f.minStockThreshold * 1.5) return { label: 'נמוך', cls: 'text-warning', bg: 'bg-amber-50' };
    return { label: 'תקין', cls: 'text-success', bg: 'bg-green-50' };
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">ניהול פילמנטים</h1>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-border px-4 py-3">
          <p className="text-xs text-muted">סה&quot;כ</p>
          <p className="text-xl font-extrabold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-border px-4 py-3">
          <p className="text-xs text-muted">פעילים</p>
          <p className="text-xl font-extrabold text-success">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-border px-4 py-3">
          <p className="text-xs text-muted">במלאי</p>
          <p className="text-xl font-extrabold text-foreground">{stats.inStock}</p>
        </div>
        <div className="bg-white rounded-xl border border-border px-4 py-3">
          <p className="text-xs text-muted">מלאי נמוך</p>
          <p className={`text-xl font-extrabold ${stats.lowStock > 0 ? 'text-warning' : 'text-foreground'}`}>{stats.lowStock}</p>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted font-medium">חומר:</span>
          <button
            onClick={() => setFilterMaterial('')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterMaterial === '' ? 'bg-foreground text-white' : 'bg-white border border-border text-muted hover:border-gray-300'
            }`}
          >
            הכל
          </button>
          {MATERIALS.map((m) => (
            <button
              key={m}
              onClick={() => setFilterMaterial(filterMaterial === m ? '' : m)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterMaterial === m ? 'bg-foreground text-white' : 'bg-white border border-border text-muted hover:border-gray-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-border mx-1 hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted font-medium">מלאי:</span>
          {[
            { key: 'all' as const, label: 'הכל' },
            { key: 'in_stock' as const, label: 'במלאי' },
            { key: 'low' as const, label: 'נמוך' },
            { key: 'out' as const, label: 'אזל' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilterStock(opt.key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStock === opt.key ? 'bg-foreground text-white' : 'bg-white border border-border text-muted hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((filament) => {
          const sl = stockLevel(filament);
          const isEditing = editingStock === filament.id;
          const isLoading = loading === filament.id;
          return (
            <div
              key={filament.id}
              className={`bg-white rounded-2xl border transition-all hover:shadow-md ${
                !filament.isActive ? 'opacity-60 border-border' : 'border-border'
              }`}
            >
              {/* Header */}
              <div className="px-4 pt-4 pb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl border-2 border-gray-100 shadow-sm shrink-0"
                    style={{ backgroundColor: filament.colorHex }}
                  />
                  <div>
                    <p className="font-bold text-foreground text-sm">{filament.localizedColorName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${MATERIAL_COLORS[filament.material]}`}>
                        {filament.material}
                      </span>
                      <span className="text-[10px] text-muted">{filament.brand}</span>
                    </div>
                  </div>
                </div>

                {/* Active Toggle */}
                <button
                  onClick={() => toggleActive(filament.id, filament.isActive)}
                  disabled={isLoading}
                  className={`relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 ${
                    filament.isActive ? 'bg-success' : 'bg-gray-300'
                  }`}
                  title={filament.isActive ? 'פעיל — לחץ להשבתה' : 'מושבת — לחץ להפעלה'}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
                      filament.isActive ? 'end-0.5' : 'start-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Stats Row */}
              <div className="px-4 pb-3 grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted-bg/50 rounded-lg py-2">
                  <p className="text-[10px] text-muted mb-0.5">מחיר/גרם</p>
                  <p className="text-xs font-bold text-foreground">₪{filament.pricePerGram}</p>
                </div>
                <div className={`rounded-lg py-2 ${sl.bg}`}>
                  <p className="text-[10px] text-muted mb-0.5">מלאי</p>
                  <p className={`text-xs font-bold ${sl.cls}`}>{sl.label}</p>
                </div>
                <div className="bg-muted-bg/50 rounded-lg py-2">
                  <p className="text-[10px] text-muted mb-0.5">גרם</p>
                  <p className="text-xs font-bold text-foreground">{filament.stockGrams}g</p>
                </div>
              </div>

              {/* Stock Bar */}
              <div className="px-4 pb-2">
                <div className="w-full bg-muted-bg rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      !filament.inStock ? 'bg-error' :
                      filament.stockGrams <= filament.minStockThreshold * 1.5 ? 'bg-warning' :
                      'bg-success'
                    }`}
                    style={{ width: `${Math.min((filament.stockGrams / (filament.minStockThreshold * 4)) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted mt-0.5">
                  <span>0g</span>
                  <span className="text-warning">{filament.minStockThreshold}g סף</span>
                  <span>{filament.minStockThreshold * 4}g</span>
                </div>
              </div>

              {/* Stock Edit */}
              <div className="px-4 pb-4">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={stockValue}
                      onChange={(e) => setStockValue(e.target.value)}
                      placeholder="גרם"
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-white text-foreground text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                      dir="ltr"
                      autoFocus
                    />
                    <button
                      onClick={() => updateStock(filament.id)}
                      disabled={isLoading}
                      className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
                    >
                      שמור
                    </button>
                    <button
                      onClick={() => { setEditingStock(null); setStockValue(''); }}
                      className="px-2 py-2 text-muted hover:text-foreground transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingStock(filament.id); setStockValue(String(filament.stockGrams)); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg text-xs font-medium text-muted hover:text-foreground hover:border-gray-400 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                    עדכן מלאי
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted text-sm">
          אין פילמנטים התואמים את הסינון
        </div>
      )}
    </div>
  );
}
