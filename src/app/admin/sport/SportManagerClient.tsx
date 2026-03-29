'use client';

/**
 * Firestore: collection `sport-products` — ensure security rules allow admin read/write
 * (and optional public read for a future sport storefront listing).
 */

import Image from 'next/image';
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
import {
  buildSportProductImagePayload,
  getSportProductThumbnailUrl,
  mapSportProductDocument,
  SPORT_PRODUCTS_COLLECTION,
} from '@/lib/firebase/sport-products';
import type { SportProduct, SportProductCategory } from '@/lib/types/sport-product';

const INPUT_CLASS =
  'w-full rounded-2xl border border-border bg-white px-3.5 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10';

const CATEGORY_OPTIONS: { value: SportProductCategory; label: string }[] = [
  { value: 'medal_hanger', label: 'מתלה מדליה' },
  { value: 'city_route', label: 'מסלול עיר' },
  { value: 'data_hex', label: 'משושה נתונים' },
  { value: 'other', label: 'אחר' },
];

function categoryLabel(c: SportProductCategory): string {
  return CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c;
}

interface SportFormState {
  nameHe: string;
  slug: string;
  category: SportProductCategory;
  basePrice: number;
  isActive: boolean;
}

type DrawerState = { mode: 'create' } | { mode: 'edit'; id: string } | null;

function sortProducts(items: SportProduct[]) {
  return [...items].sort((a, b) => a.nameHe.localeCompare(b.nameHe, 'he'));
}

function normalizeSlugInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function buildFormFromProduct(p: SportProduct): SportFormState {
  return {
    nameHe: p.nameHe,
    slug: p.slug,
    category: p.category,
    basePrice: p.basePrice,
    isActive: p.isActive,
  };
}

function validateForm(form: SportFormState, mode: 'create' | 'edit'): string | null {
  if (!form.nameHe.trim()) return 'יש להזין שם מוצר בעברית.';
  if (mode === 'create') {
    if (!form.slug.trim()) return 'יש להזין מזהה באנגלית (slug).';
    if (!SLUG_RE.test(form.slug.trim())) {
      return 'מזהה באנגלית: אותיות קטנות, מספרים ומקף בלבד.';
    }
  }
  if (!Number.isFinite(form.basePrice) || form.basePrice < 0) return 'מחיר בסיס לא תקין.';
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

function ProductThumb({ product }: { product: SportProduct }) {
  const src = getSportProductThumbnailUrl(product);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] font-medium text-slate-400">
        —
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={product.nameHe}
      width={56}
      height={56}
      className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function SportManagerClient() {
  const db = useMemo(() => getFirebaseClientFirestore(), []);

  const [products, setProducts] = useState<SportProduct[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [form, setForm] = useState<SportFormState | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const loadProducts = useCallback(async () => {
    setListLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, SPORT_PRODUCTS_COLLECTION));
      const list: SportProduct[] = [];
      snap.forEach((d) => {
        list.push(mapSportProductDocument(d.id, d.data() as Record<string, unknown>));
      });
      setProducts(sortProducts(list));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שגיאת טעינה';
      setError(`טעינת מוצרי ספורט נכשלה: ${msg}`);
      setProducts([]);
    } finally {
      setListLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const sortedAll = useMemo(() => sortProducts(products), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedAll;
    return sortedAll.filter(
      (p) =>
        p.nameHe.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        categoryLabel(p.category).toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );
  }, [sortedAll, search]);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [products]);

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

  function updateForm<K extends keyof SportFormState>(key: K, value: SportFormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function openCreate() {
    setDrawer({ mode: 'create' });
    setForm({
      nameHe: '',
      slug: '',
      category: 'medal_hanger',
      basePrice: 89,
      isActive: true,
    });
    setError(null);
  }

  function openEdit(p: SportProduct) {
    setDrawer({ mode: 'edit', id: p.id });
    setForm(buildFormFromProduct(p));
    setError(null);
  }

  async function patchProduct(id: string, patch: Partial<Pick<SportProduct, 'isActive'>>) {
    setLoadingId(id);
    setError(null);
    try {
      await updateDoc(doc(db, SPORT_PRODUCTS_COLLECTION, id), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
      setProducts((prev) =>
        sortProducts(
          prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
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
    const err = validateForm(form, drawer.mode === 'create' ? 'create' : 'edit');
    if (err) {
      setError(err);
      return;
    }

    const name = form.nameHe.trim();
    setSaving(true);
    setError(null);

    try {
      if (drawer.mode === 'create') {
        const slug = form.slug.trim();
        const exists = products.some((p) => p.id === slug);
        if (exists) {
          setError('מזהה זה כבר קיים. בחרו שם אחר.');
          setSaving(false);
          return;
        }
        const images = buildSportProductImagePayload(slug);
        await setDoc(doc(db, SPORT_PRODUCTS_COLLECTION, slug), {
          nameHe: name,
          name,
          slug,
          category: form.category,
          basePrice: form.basePrice,
          isActive: form.isActive,
          images,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, SPORT_PRODUCTS_COLLECTION, drawer.id), {
          nameHe: name,
          name,
          slug: drawer.id,
          category: form.category,
          basePrice: form.basePrice,
          isActive: form.isActive,
          updatedAt: serverTimestamp(),
        });
      }
      closeDrawer();
      await loadProducts();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שמירה נכשלה';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!window.confirm('למחוק מוצר ספורט זה?')) return;
    setLoadingId(id);
    setError(null);
    try {
      await deleteDoc(doc(db, SPORT_PRODUCTS_COLLECTION, id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
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
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">ניהול ספורט</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          ניהול מוצרי מודלו ספורט בקולקציית <span dir="ltr">sport-products</span>. תמונת ממוזערת מ־{' '}
          <span dir="ltr" className="font-mono text-xs">
            sport-products/&#123;slug&#125;/thumbnail.jpeg
          </span>
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="סה״כ מוצרים"
          value={stats.total}
          sub="מסמכים בקולקציה"
          accent="bg-slate-900 text-white"
        />
        <StatCard
          label="פעילים"
          value={stats.active}
          sub="מוצגים באתר לפי הכללים"
          accent="bg-primary/15 text-primary"
        />
        <StatCard
          label="לא פעילים"
          value={stats.inactive}
          sub="מוסתרים מהמכירה"
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
            placeholder="חיפוש לפי שם, קטגוריה או slug..."
            className={`${INPUT_CLASS} pr-10`}
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          הוסף מוצר ספורט
        </button>
      </div>

      <section className="rounded-[22px] border border-slate-200 bg-white shadow-sm">
        {listLoading ? (
          <div className="px-6 py-16 text-center text-muted">
            <p className="text-sm">טוען נתונים מ־sport-products…</p>
          </div>
        ) : products.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted">
            <p className="font-semibold text-foreground">אין מוצרים</p>
            <p className="mt-2 text-sm">הוסיפו מוצר מהכפתור למעלה.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted">
            <p className="font-semibold text-foreground">לא נמצאו תוצאות</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full min-w-[920px] border-collapse text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="p-4 text-center align-middle">תמונה וזיהוי</th>
                  <th className="p-4 text-right align-middle">שם המוצר</th>
                  <th className="p-4 text-center align-middle">סוג מוצר</th>
                  <th className="p-4 text-center align-middle">מחיר בסיס</th>
                  <th className="p-4 text-center align-middle">פעיל</th>
                  <th className="p-4 text-center align-middle">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const loading = loadingId === p.id;
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${loading ? 'opacity-60' : ''}`}
                    >
                      <td className="p-4 align-middle">
                        <div className="flex flex-col items-center gap-1">
                          <ProductThumb product={p} />
                          <span className="font-mono text-[10px] text-slate-500" dir="ltr">
                            {p.slug}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <p className="font-bold text-slate-900">{p.nameHe}</p>
                      </td>
                      <td className="p-4 align-middle text-center font-semibold text-slate-700">
                        {categoryLabel(p.category)}
                      </td>
                      <td className="p-4 align-middle text-center font-extrabold tabular-nums text-slate-900" dir="ltr">
                        ₪{p.basePrice}
                      </td>
                      <td className="overflow-visible p-4 align-middle">
                        <TableToggle
                          checked={p.isActive}
                          disabled={loading}
                          ariaLabel="מוצר פעיל"
                          onChange={(v) => patchProduct(p.id, { isActive: v })}
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => openEdit(p)}
                            className="rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            aria-label="עריכה"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => deleteProduct(p.id)}
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
            aria-labelledby="sport-drawer-title"
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
                <h2 id="sport-drawer-title" className="text-lg font-extrabold text-slate-900">
                  {isCreate ? 'הוספת מוצר ספורט' : 'עריכת מוצר ספורט'}
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
                    <Field label="שם המוצר בעברית">
                      <input
                        className={INPUT_CLASS}
                        value={form.nameHe}
                        onChange={(e) => updateForm('nameHe', e.target.value)}
                        placeholder="למשל: מתלה מדליה - מרתון פריז"
                      />
                    </Field>

                    <Field
                      label="מזהה באנגלית (slug)"
                      hint={isCreate ? 'יהפוך למזהה המסמך ב-Firestore' : 'לא ניתן לשינוי'}
                    >
                      <input
                        className={`${INPUT_CLASS} font-mono`}
                        dir="ltr"
                        value={form.slug}
                        disabled={!isCreate}
                        onChange={(e) => updateForm('slug', normalizeSlugInput(e.target.value))}
                        placeholder="paris-marathon-medal"
                      />
                    </Field>

                    <Field label="סוג מוצר">
                      <select
                        className={INPUT_CLASS}
                        value={form.category}
                        onChange={(e) =>
                          updateForm('category', e.target.value as SportProductCategory)
                        }
                      >
                        {CATEGORY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="מחיר בסיס (₪)">
                      <input
                        className={INPUT_CLASS}
                        dir="ltr"
                        type="number"
                        min={0}
                        step={1}
                        value={form.basePrice}
                        onChange={(e) =>
                          updateForm('basePrice', Math.max(0, Number(e.target.value) || 0))
                        }
                      />
                    </Field>

                    <DrawerSwitch
                      label="מוצר פעיל"
                      description="כבוי מסתיר את המוצר מהמכירה באתר."
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
