'use client';

/**
 * Firestore: collection `coupons` — ensure security rules allow admin read/write
 * (same pattern as `filaments`). Deploy rules before production use.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { getFirebaseClientFirestore } from '@/lib/firebase/client';
import { COUPONS_COLLECTION, docToCoupon } from '@/lib/firebase/coupons';
import type { Coupon, CouponDiscountType } from '@/lib/types/coupon';

const INPUT_CLASS =
  'w-full rounded-2xl border border-border bg-white px-3.5 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10';

interface CouponFormState {
  code: string;
  discountType: CouponDiscountType;
  value: number;
  expirationDate: string;
  isActive: boolean;
}

type DrawerState = { mode: 'create' } | { mode: 'edit'; id: string } | null;

function newCouponId() {
  return `cpn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function sortCoupons(items: Coupon[]) {
  return [...items].sort((a, b) => a.code.localeCompare(b.code, 'en'));
}

function buildFormFromCoupon(c: Coupon): CouponFormState {
  return {
    code: c.code,
    discountType: c.discountType,
    value: c.value,
    expirationDate: c.expirationDate,
    isActive: c.isActive,
  };
}

function isExpired(expirationDate: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expirationDate);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const end = new Date(y, mo - 1, d, 23, 59, 59, 999);
  return end < new Date();
}

function formatDateDisplay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return '—';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function validateForm(form: CouponFormState): string | null {
  if (!form.code.trim()) return 'יש להזין קוד קופון.';
  if (!form.expirationDate) return 'יש לבחור תאריך תוקף.';
  if (!Number.isFinite(form.value) || form.value <= 0) return 'הערך חייב להיות מספר חיובי.';
  if (form.discountType === 'percent' && form.value > 100) {
    return 'אחוז הנחה לא יכול לעלות על 100.';
  }
  return null;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

function DrawerSwitch({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onToggle(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 text-right transition-all ${
        checked ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/15' : 'border-border bg-white hover:border-slate-300'
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted">{description}</p>
      </div>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-0.5' : 'translate-x-5'
          }`}
        />
      </span>
    </button>
  );
}

function TableToggle({
  checked,
  disabled,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <div dir="ltr" className="flex min-h-[44px] min-w-[60px] items-center justify-center overflow-visible px-1 py-1">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          checked ? 'bg-primary' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-[left] duration-200 ease-out ${
            checked ? 'left-[calc(100%-1.625rem)]' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-3xl font-extrabold tabular-nums text-slate-900">{value}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${accent}`}>
          ●
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

export function CouponsClient() {
  const db = useMemo(() => getFirebaseClientFirestore(), []);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [form, setForm] = useState<CouponFormState | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const loadCoupons = useCallback(async () => {
    setListLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, COUPONS_COLLECTION));
      const list: Coupon[] = [];
      snap.forEach((d) => {
        const c = docToCoupon(d.id, d.data() as Record<string, unknown>);
        if (c) list.push(c);
      });
      setCoupons(sortCoupons(list));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שגיאת טעינה';
      setError(`טעינת קופונים נכשלה: ${msg}`);
      setCoupons([]);
    } finally {
      setListLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  const sortedAll = useMemo(() => sortCoupons(coupons), [coupons]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedAll;
    return sortedAll.filter((c) => c.code.toLowerCase().includes(q));
  }, [sortedAll, search]);

  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.isActive).length;
    const expired = coupons.filter((c) => isExpired(c.expirationDate)).length;
    return { total, active, expired };
  }, [coupons]);

  const drawerOpen = drawer !== null && form !== null;

  const closeDrawer = useCallback(() => {
    setDrawer(null);
    setForm(null);
    setError(null);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  function updateForm<K extends keyof CouponFormState>(key: K, value: CouponFormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function openCreate() {
    setDrawer({ mode: 'create' });
    setForm({
      code: '',
      discountType: 'percent',
      value: 10,
      expirationDate: '',
      isActive: true,
    });
    setError(null);
  }

  function openEdit(c: Coupon) {
    setDrawer({ mode: 'edit', id: c.id });
    setForm(buildFormFromCoupon(c));
    setError(null);
  }

  async function patchCoupon(id: string, patch: Partial<Pick<Coupon, 'isActive'>>) {
    setLoadingId(id);
    setError(null);
    try {
      await updateDoc(doc(db, COUPONS_COLLECTION, id), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
      setCoupons((prev) =>
        sortCoupons(
          prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        ),
      );
      if (form && drawer?.mode === 'edit' && drawer.id === id && patch.isActive !== undefined) {
        setForm((prev) => (prev ? { ...prev, isActive: patch.isActive! } : prev));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'עדכון נכשל';
      setError(msg);
    } finally {
      setLoadingId(null);
    }
  }

  async function saveDrawer() {
    if (!form || !drawer) return;
    const err = validateForm(form);
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError(null);
    const code = form.code.trim().toUpperCase();
    const payload = {
      code,
      discountType: form.discountType,
      value: form.discountType === 'percent' ? Math.round(form.value) : Number(form.value),
      expirationDate: form.expirationDate,
      isActive: form.isActive,
      updatedAt: serverTimestamp(),
    };

    try {
      if (drawer.mode === 'create') {
        const newId = newCouponId();
        await setDoc(doc(db, COUPONS_COLLECTION, newId), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, COUPONS_COLLECTION, drawer.id), payload);
      }
      closeDrawer();
      await loadCoupons();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שמירה נכשלה';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCoupon(id: string) {
    if (!window.confirm('למחוק קופון זה?')) return;
    setLoadingId(id);
    setError(null);
    try {
      await deleteDoc(doc(db, COUPONS_COLLECTION, id));
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      if (drawer?.mode === 'edit' && drawer.id === id) closeDrawer();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'מחיקה נכשלה';
      setError(msg);
    } finally {
      setLoadingId(null);
    }
  }

  const isCreate = drawer?.mode === 'create';

  return (
    <div className="animate-fade-in space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">קופונים ומבצעים</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          ניהול קודי הנחה בקולקציית <span dir="ltr">coupons</span> — עדכונים ישירים ב-Firestore.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="סה״כ קופונים"
          value={stats.total}
          sub="רשומות בקולקציה"
          accent="bg-slate-900 text-white"
        />
        <StatCard
          label="פעילים"
          value={stats.active}
          sub="מסומנים כפעילים"
          accent="bg-primary/15 text-primary"
        />
        <StatCard
          label="פג תוקף"
          value={stats.expired}
          sub="לפי תאריך סיום"
          accent="bg-amber-100 text-amber-900"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xl flex-1">
          <Search
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={1.8}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי קוד קופון..."
            className={`${INPUT_CLASS} pr-10`}
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          הוסף קופון
        </button>
      </div>

      <section className="rounded-[22px] border border-slate-200 bg-white shadow-sm">
        {listLoading ? (
          <div className="px-6 py-16 text-center text-muted">
            <p className="text-sm">טוען נתונים מ־coupons…</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted">
            <p className="font-semibold text-foreground">אין קופונים</p>
            <p className="mt-2 text-sm">הוסיפו קופון חדש מהכפתור למעלה.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted">
            <p className="font-semibold text-foreground">לא נמצאו תוצאות</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full min-w-[800px] border-collapse text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="p-4 text-right align-middle">קוד קופון</th>
                  <th className="p-4 text-center align-middle">סוג הנחה</th>
                  <th className="p-4 text-center align-middle">ערך</th>
                  <th className="p-4 text-center align-middle">תוקף</th>
                  <th className="p-4 text-center align-middle">פעיל</th>
                  <th className="p-4 text-center align-middle">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const loading = loadingId === c.id;
                  const expired = isExpired(c.expirationDate);
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${loading ? 'opacity-60' : ''}`}
                    >
                      <td className="p-4 align-middle">
                        <p className="font-extrabold text-slate-900" dir="ltr">
                          {c.code}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400" dir="ltr">
                          {c.id}
                        </p>
                      </td>
                      <td className="p-4 align-middle text-center font-semibold text-slate-700">
                        {c.discountType === 'percent' ? 'אחוז %' : 'סכום קבוע ₪'}
                      </td>
                      <td className="p-4 align-middle text-center tabular-nums font-bold text-slate-900" dir="ltr">
                        {c.discountType === 'percent' ? `${c.value}%` : `₪${c.value}`}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <span className="tabular-nums font-semibold text-slate-800">
                            {formatDateDisplay(c.expirationDate)}
                          </span>
                          {expired ? (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-100">
                              פג תוקף
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="overflow-visible p-4 align-middle">
                        <TableToggle
                          checked={c.isActive}
                          disabled={loading}
                          ariaLabel="קופון פעיל"
                          onChange={(v) => patchCoupon(c.id, { isActive: v })}
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => openEdit(c)}
                            className="rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            aria-label="עריכה"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => deleteCoupon(c.id)}
                            className="rounded-lg p-2.5 text-red-600 hover:bg-red-50"
                            aria-label="מחיקה"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {portalReady &&
        drawerOpen &&
        form &&
        createPortal(
          <div
            className="fixed inset-0 z-[100]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-drawer-title"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={closeDrawer}
              aria-hidden="true"
            />
            <aside
              className="absolute top-0 right-0 z-10 flex h-full max-h-[100dvh] w-full max-w-md flex-col bg-white shadow-2xl"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 id="coupon-drawer-title" className="text-lg font-extrabold text-slate-900">
                  {isCreate ? 'הוספת קופון חדש' : 'עריכת קופון'}
                </h2>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-100"
                  aria-label="סגור"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </header>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
                  <div className="space-y-5">
                    <Field label="קוד קופון">
                      <input
                        className={`${INPUT_CLASS} font-mono uppercase`}
                        dir="ltr"
                        value={form.code}
                        onChange={(e) => updateForm('code', e.target.value.toUpperCase())}
                        placeholder="SUMMER20"
                        autoComplete="off"
                      />
                    </Field>

                    <Field label="סוג הנחה">
                      <select
                        className={INPUT_CLASS}
                        value={form.discountType}
                        onChange={(e) =>
                          updateForm('discountType', e.target.value as CouponDiscountType)
                        }
                      >
                        <option value="percent">אחוז הנחה %</option>
                        <option value="fixed">סכום קבוע ₪</option>
                      </select>
                    </Field>

                    <Field
                      label={form.discountType === 'percent' ? 'אחוז הנחה' : 'סכום (₪)'}
                      hint={form.discountType === 'percent' ? '1–100' : undefined}
                    >
                      <input
                        className={INPUT_CLASS}
                        dir="ltr"
                        type="number"
                        min={form.discountType === 'percent' ? 1 : 0.01}
                        max={form.discountType === 'percent' ? 100 : undefined}
                        step={form.discountType === 'percent' ? 1 : 0.01}
                        value={form.value}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          updateForm('value', Number.isFinite(n) ? n : 0);
                        }}
                      />
                    </Field>

                    <Field label="תאריך תוקף">
                      <input
                        className={INPUT_CLASS}
                        type="date"
                        dir="ltr"
                        value={form.expirationDate}
                        onChange={(e) => updateForm('expirationDate', e.target.value)}
                      />
                    </Field>

                    <DrawerSwitch
                      label="קופון פעיל"
                      description="קופון לא פעיל לא יוחל בעת התשלום."
                      checked={form.isActive}
                      onToggle={(v) => updateForm('isActive', v)}
                    />
                  </div>
                </div>

                <div className="mt-auto flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white p-4 shadow-[0_-4px_16px_-8px_rgba(15,23,42,0.12)] sticky bottom-0 z-10">
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
                  >
                    ביטול
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveDrawer}
                    className="rounded-2xl bg-slate-900 px-8 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {saving ? 'שומר...' : isCreate ? 'יצירה' : 'שמירה'}
                  </button>
                </div>
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </div>
  );
}
