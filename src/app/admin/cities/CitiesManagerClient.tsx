'use client';

/**
 * Firestore: collection `cities` — ensure security rules allow admin read/write
 * (and public read for storefront lists, or gate via Cloud Functions). Deploy rules accordingly.
 */

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ArrowUpDown, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { getFirebaseClientFirestore } from '@/lib/firebase/client';
import {
  buildCityStorageImageUrls,
  CITIES_COLLECTION,
  getCityMinicubePreviewUrl,
  mapCityDocument,
  type CityDoc,
} from '@/lib/firebase/cities';

const INPUT_CLASS =
  'w-full rounded-2xl border border-border bg-white px-3.5 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10';

interface CityFormState {
  nameHe: string;
  slug: string;
  priceMinicube: number;
  priceCube: number;
  inStock: boolean;
  isBestSeller: boolean;
}

type DrawerState = { mode: 'create' } | { mode: 'edit'; id: string } | null;

function sortCities(items: CityDoc[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'he'));
}

function normalizeSlugInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function buildFormFromCity(c: CityDoc): CityFormState {
  return {
    nameHe: c.name,
    slug: c.slug,
    priceMinicube: c.priceMinicube ?? 159,
    priceCube: c.priceCube ?? 199,
    inStock: Boolean(c.inStock),
    isBestSeller: Boolean(c.isBestSeller),
  };
}

function validateForm(form: CityFormState, mode: 'create' | 'edit'): string | null {
  if (!form.nameHe.trim()) return 'יש להזין שם עיר בעברית.';
  if (mode === 'create') {
    if (!form.slug.trim()) return 'יש להזין מזהה באנגלית (slug).';
    if (!SLUG_RE.test(form.slug.trim())) {
      return 'מזהה באנגלית: אותיות קטנות, מספרים ומקף בלבד.';
    }
  }
  if (!Number.isFinite(form.priceMinicube) || form.priceMinicube < 0) return 'מחיר מיני־קובייה לא תקין.';
  if (!Number.isFinite(form.priceCube) || form.priceCube < 0) return 'מחיר קובייה לא תקין.';
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

function CityThumb({ city }: { city: CityDoc }) {
  const src = getCityMinicubePreviewUrl(city);
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
      alt={city.name}
      width={56}
      height={56}
      className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function CitiesManagerClient() {
  const db = useMemo(() => getFirebaseClientFirestore(), []);

  const [cities, setCities] = useState<CityDoc[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [form, setForm] = useState<CityFormState | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const loadCities = useCallback(async () => {
    setListLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, CITIES_COLLECTION));
      const list: CityDoc[] = [];
      snap.forEach((d) => {
        list.push(mapCityDocument(d.id, d.data() as Record<string, unknown>));
      });
      setCities(sortCities(list));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שגיאת טעינה';
      setError(`טעינת ערים נכשלה: ${msg}`);
      setCities([]);
    } finally {
      setListLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void loadCities();
  }, [loadCities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
    );
  }, [cities, search]);

  const sortedForDisplay = useMemo(() => {
    return [...filtered].sort((a, b) =>
      sortOrder === 'asc'
        ? a.name.localeCompare(b.name, 'he')
        : b.name.localeCompare(a.name, 'he'),
    );
  }, [filtered, sortOrder]);

  const displayedIds = useMemo(() => sortedForDisplay.map((c) => c.id), [sortedForDisplay]);

  const allDisplayedSelected =
    displayedIds.length > 0 && displayedIds.every((id) => selectedIds.includes(id));
  const someDisplayedSelected = displayedIds.some((id) => selectedIds.includes(id));

  useEffect(() => {
    const el = masterCheckboxRef.current;
    if (el) el.indeterminate = someDisplayedSelected && !allDisplayedSelected;
  }, [someDisplayedSelected, allDisplayedSelected]);

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAllDisplayed() {
    setSelectedIds((prev) => {
      const allSelected =
        displayedIds.length > 0 && displayedIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !displayedIds.includes(id));
      }
      return Array.from(new Set([...prev, ...displayedIds]));
    });
  }

  const stats = useMemo(() => {
    const total = cities.length;
    const out = cities.filter((c) => !c.inStock).length;
    return { total, out };
  }, [cities]);

  const drawerOpen = drawer !== null && form !== null;

  const closeDrawer = useCallback(() => {
    setDrawer(null);
    setForm(null);
    setError(null);
  }, []);

  async function handleBulkAction(
    actionType: 'inStock' | 'isBestSeller' | 'delete',
    value?: boolean,
  ) {
    if (selectedIds.length === 0) return;
    if (actionType === 'delete') {
      if (!window.confirm('האם אתה בטוח שברצונך למחוק את הערים שנבחרו?')) return;
    }

    setBulkLoading(true);
    setError(null);
    const ids = [...selectedIds];

    try {
      if (actionType === 'delete') {
        await Promise.all(ids.map((id) => deleteDoc(doc(db, CITIES_COLLECTION, id))));
        setCities((prev) => prev.filter((c) => !ids.includes(c.id)));
        if (drawer?.mode === 'edit' && drawer.id && ids.includes(drawer.id)) closeDrawer();
      } else {
        const field = actionType === 'inStock' ? 'inStock' : 'isBestSeller';
        const v = Boolean(value);
        await Promise.all(
          ids.map((id) =>
            updateDoc(doc(db, CITIES_COLLECTION, id), {
              [field]: v,
              updatedAt: serverTimestamp(),
            }),
          ),
        );
        setCities((prev) =>
          sortCities(
            prev.map((c) => (ids.includes(c.id) ? { ...c, [field]: v } : c)),
          ),
        );
      }
      setSelectedIds([]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'פעולה גורפת נכשלה';
      setError(msg);
    } finally {
      setBulkLoading(false);
    }
  }

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

  function updateForm<K extends keyof CityFormState>(key: K, value: CityFormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function openCreate() {
    setDrawer({ mode: 'create' });
    setForm({
      nameHe: '',
      slug: '',
      priceMinicube: 159,
      priceCube: 199,
      inStock: true,
      isBestSeller: false,
    });
    setError(null);
  }

  function openEdit(c: CityDoc) {
    setDrawer({ mode: 'edit', id: c.id });
    setForm(buildFormFromCity(c));
    setError(null);
  }

  async function patchCity(id: string, patch: Partial<Pick<CityDoc, 'inStock' | 'isBestSeller'>>) {
    setLoadingId(id);
    setError(null);
    try {
      const nextInStock = patch.inStock !== undefined ? Boolean(patch.inStock) : undefined;
      const nextBest = patch.isBestSeller !== undefined ? Boolean(patch.isBestSeller) : undefined;
      const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (nextInStock !== undefined) payload.inStock = nextInStock;
      if (nextBest !== undefined) payload.isBestSeller = nextBest;

      await updateDoc(doc(db, CITIES_COLLECTION, id), payload);

      const normalized: Partial<Pick<CityDoc, 'inStock' | 'isBestSeller'>> = {};
      if (nextInStock !== undefined) normalized.inStock = nextInStock;
      if (nextBest !== undefined) normalized.isBestSeller = nextBest;

      setCities((prev) =>
        sortCities(
          prev.map((c) => (c.id === id ? { ...c, ...normalized } : c)),
        ),
      );
      if (form && drawer?.mode === 'edit' && drawer.id === id) {
        setForm((prev) => {
          if (!prev) return prev;
          let next = { ...prev };
          if (nextInStock !== undefined) next = { ...next, inStock: nextInStock };
          if (nextBest !== undefined) next = { ...next, isBestSeller: nextBest };
          return next;
        });
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
        const exists = cities.some((c) => c.id === slug);
        if (exists) {
          setError('מזהה זה כבר קיים. בחרו שם אחר.');
          setSaving(false);
          return;
        }
        const images = buildCityStorageImageUrls(slug);
        await setDoc(doc(db, CITIES_COLLECTION, slug), {
          nameHe: name,
          name,
          slug,
          priceMinicube: form.priceMinicube,
          priceCube: form.priceCube,
          inStock: Boolean(form.inStock),
          isBestSeller: Boolean(form.isBestSeller),
          images,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, CITIES_COLLECTION, drawer.id), {
          nameHe: name,
          name,
          slug: drawer.id,
          priceMinicube: form.priceMinicube,
          priceCube: form.priceCube,
          inStock: Boolean(form.inStock),
          isBestSeller: Boolean(form.isBestSeller),
          updatedAt: serverTimestamp(),
        });
      }
      closeDrawer();
      await loadCities();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שמירה נכשלה';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCity(id: string) {
    if (!window.confirm('למחוק עיר זו מ-Firestore?')) return;
    setLoadingId(id);
    setError(null);
    try {
      await deleteDoc(doc(db, CITIES_COLLECTION, id));
      setCities((prev) => prev.filter((c) => c.id !== id));
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
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">ניהול סיטיז</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          ניהול ערים בקולקציית <span dir="ltr">cities</span> — תמונות מ־Storage לפי נתיב{' '}
          <span dir="ltr" className="font-mono text-xs">
            cities/&#123;slug&#125;/minicube.jpeg
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
          label="סה״כ ערים"
          value={stats.total}
          sub="מסמכים בקולקציה"
          accent="bg-slate-900 text-white"
        />
        <StatCard
          label="לא במלאי (מוסתרות)"
          value={stats.out}
          sub="לא מוצגות באשף הלקוחות"
          accent="bg-amber-100 text-amber-900"
        />
        <StatCard
          label="זמינות למכירה"
          value={Math.max(0, stats.total - stats.out)}
          sub="מוצגות באשף"
          accent="bg-primary/15 text-primary"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1 sm:gap-3">
          <div className="relative max-w-xl flex-1">
            <Search
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              strokeWidth={1.8}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם, slug או מזהה..."
              className={`${INPUT_CLASS} pr-10`}
            />
          </div>
          <button
            type="button"
            onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            title={sortOrder === 'asc' ? 'מיון א׳–ת׳' : 'מיון ת׳–א׳'}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50"
          >
            מיון (א-ת)
            <ArrowUpDown
              className={`h-4 w-4 text-slate-500 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
              strokeWidth={2}
            />
          </button>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          הוסף עיר חדשה
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div
          className="mb-4 flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:flex-row sm:items-center sm:justify-between"
          role="region"
          aria-label="פעולות גורפות"
        >
          <p className="text-sm font-semibold text-slate-800">
            נבחרו {selectedIds.length} פריטים
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => void handleBulkAction('inStock', true)}
              className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              סמן כבמלאי
            </button>
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => void handleBulkAction('inStock', false)}
              className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              הסר מהמלאי
            </button>
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => void handleBulkAction('isBestSeller', true)}
              className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              סמן כנמכרים ביותר
            </button>
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => void handleBulkAction('isBestSeller', false)}
              className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              הסר מנמכרים ביותר
            </button>
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => void handleBulkAction('delete')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              מחק נבחרים
            </button>
          </div>
        </div>
      )}

      <section className="rounded-[22px] border border-slate-200 bg-white shadow-sm">
        {listLoading ? (
          <div className="px-6 py-16 text-center text-muted">
            <p className="text-sm">טוען נתונים מ־cities…</p>
          </div>
        ) : cities.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted">
            <p className="font-semibold text-foreground">אין ערים</p>
            <p className="mt-2 text-sm">הוסיפו עיר מהכפתור למעלה או הריצו את סקריפט ה-seed.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted">
            <p className="font-semibold text-foreground">לא נמצאו תוצאות</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full min-w-[1140px] border-collapse text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="w-12 p-3 text-center align-middle">
                    <input
                      ref={masterCheckboxRef}
                      type="checkbox"
                      checked={allDisplayedSelected}
                      onChange={toggleSelectAllDisplayed}
                      disabled={bulkLoading || sortedForDisplay.length === 0}
                      className="h-4 w-4 cursor-pointer rounded accent-blue-600 disabled:cursor-not-allowed"
                      title="בחר הכל / נקה תצוגה"
                      aria-label="בחר את כל הערים המוצגות"
                    />
                  </th>
                  <th className="p-4 text-center align-middle">תמונה וזיהוי</th>
                  <th className="p-4 text-right align-middle">שם העיר</th>
                  <th className="p-4 text-center align-middle">מיני־קובייה</th>
                  <th className="p-4 text-center align-middle">מחיר קובייה</th>
                  <th className="p-4 text-center align-middle">במלאי</th>
                  <th className="p-4 text-center align-middle">נמכר ביותר</th>
                  <th className="p-4 text-center align-middle">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {sortedForDisplay.map((c) => {
                  const loading = loadingId === c.id;
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${loading ? 'opacity-60' : ''}`}
                    >
                      <td className="p-3 align-middle text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleSelectRow(c.id)}
                          disabled={bulkLoading || loading}
                          className="h-4 w-4 cursor-pointer rounded accent-blue-600 disabled:cursor-not-allowed"
                          aria-label={`בחר ${c.name}`}
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col items-center gap-1">
                          <CityThumb city={c} />
                          <span className="font-mono text-[10px] text-slate-500" dir="ltr">
                            {c.slug}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <p className="font-bold text-slate-900">{c.name}</p>
                      </td>
                      <td className="p-4 align-middle text-center font-extrabold tabular-nums text-slate-900" dir="ltr">
                        ₪{c.priceMinicube ?? 159}
                      </td>
                      <td className="p-4 align-middle text-center font-extrabold tabular-nums text-slate-900" dir="ltr">
                        ₪{c.priceCube ?? 199}
                      </td>
                      <td className="overflow-visible p-4 align-middle">
                        <TableToggle
                          checked={c.inStock}
                          disabled={loading}
                          ariaLabel="במלאי — הצגה באשף"
                          onChange={(v) => patchCity(c.id, { inStock: v })}
                        />
                      </td>
                      <td className="overflow-visible p-4 align-middle">
                        <TableToggle
                          checked={c.isBestSeller}
                          disabled={loading}
                          ariaLabel="נמכר ביותר — חנות"
                          onChange={(v) => patchCity(c.id, { isBestSeller: v })}
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
                            onClick={() => deleteCity(c.id)}
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
            aria-labelledby="city-drawer-title"
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
                <h2 id="city-drawer-title" className="text-lg font-extrabold text-slate-900">
                  {isCreate ? 'הוספת עיר חדשה' : 'עריכת עיר'}
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
                    <Field label="שם העיר בעברית">
                      <input
                        className={INPUT_CLASS}
                        value={form.nameHe}
                        onChange={(e) => updateForm('nameHe', e.target.value)}
                        placeholder="למשל: תל אביב"
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
                        placeholder="tel-aviv"
                      />
                    </Field>

                    <Field label="מחיר מיני־קובייה (₪)">
                      <input
                        className={INPUT_CLASS}
                        dir="ltr"
                        type="number"
                        min={0}
                        step={1}
                        value={form.priceMinicube}
                        onChange={(e) =>
                          updateForm('priceMinicube', Math.max(0, Number(e.target.value) || 0))
                        }
                      />
                    </Field>

                    <Field label="מחיר קובייה (₪)">
                      <input
                        className={INPUT_CLASS}
                        dir="ltr"
                        type="number"
                        min={0}
                        step={1}
                        value={form.priceCube}
                        onChange={(e) =>
                          updateForm('priceCube', Math.max(0, Number(e.target.value) || 0))
                        }
                      />
                    </Field>

                    <DrawerSwitch
                      label="במלאי — הצגה באשף"
                      description="כבוי מסתיר את העיר מרשימת הבחירה באתר."
                      checked={form.inStock}
                      onToggle={(v) => updateForm('inStock', v)}
                    />

                    <DrawerSwitch
                      label="נמכר ביותר"
                      description="מוצג בקרוסלת «הנמכרים ביותר» בעמוד הסיטיז (רק כשגם במלאי)."
                      checked={form.isBestSeller}
                      onToggle={(v) => updateForm('isBestSeller', v)}
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
