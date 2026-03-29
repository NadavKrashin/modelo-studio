'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { ArrowDown, ArrowUp, ArrowUpDown, GripVertical, Minus, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { getFirebaseClientFirestore } from '@/lib/firebase/client';
import {
  deriveStockStatusFromRolls,
  FILAMENTS_COLLECTION,
  supplyDocToFilament,
} from '@/lib/firebase/supply-tracker';
import type { Filament, FilamentMaterial, UpdateFilamentInput } from '@/lib/types';

const MATERIALS: FilamentMaterial[] = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon', 'Resin'];

const INPUT_CLASS =
  'w-full rounded-2xl border border-border bg-white px-3.5 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10';

interface FilamentFormState {
  colorName: string;
  hexColor: string;
  materialType: FilamentMaterial;
  rollQuantity: number;
  isSportColor: boolean;
  isActive: boolean;
}

type DrawerState = { mode: 'create' } | { mode: 'edit'; id: string } | null;

function sortFilaments(items: Filament[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function reorderArray<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return [...list];
  const next = [...list];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}

function buildFormFromFilament(f: Filament): FilamentFormState {
  return {
    colorName: f.name,
    hexColor: f.hexColor,
    materialType: f.materialType,
    rollQuantity: f.rollQuantity,
    isSportColor: f.isSportColor ?? false,
    isActive: f.isActive,
  };
}

function normalizeHexInput(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === '') return '';
  const prefixed = normalized.startsWith('#') ? normalized : `#${normalized}`;
  return /^#[0-9A-F]{0,6}$/.test(prefixed) ? prefixed : null;
}

function isValidHexColor(value: string) {
  return /^#[0-9A-F]{6}$/i.test(value.trim());
}

function newFilamentId() {
  return `fil-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function computeAvailableForSave(form: FilamentFormState, prev: Filament | null, isCreate: boolean): boolean {
  if (!form.isActive) return false;
  if (form.rollQuantity <= 0) return false;
  if (isCreate) return true;
  if (prev && prev.rollQuantity === 0 && form.rollQuantity > 0) return true;
  return prev?.available ?? true;
}

function validateForm(form: FilamentFormState) {
  if (!form.colorName.trim()) return 'יש להזין שם צבע.';
  if (!isValidHexColor(form.hexColor)) return 'יש להזין קוד צבע HEX תקין.';
  if (!Number.isInteger(form.rollQuantity) || form.rollQuantity < 0) {
    return 'כמות גלילים חייבת להיות מספר שלם ≥ 0.';
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

function DrawerHexColorField({
  hexColor,
  onHexChange,
}: {
  hexColor: string;
  onHexChange: (v: string) => void;
}) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const displayHex = isValidHexColor(hexColor) ? hexColor.toUpperCase() : '#FFFFFF';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">גוון (HEX)</span>
        <span
          className="font-mono text-xs text-muted tabular-nums"
          dir="ltr"
        >
          {displayHex}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
        >
          <span
            className="h-9 w-9 shrink-0 rounded-xl border border-slate-200 shadow-inner ring-1 ring-black/5"
            style={{ backgroundColor: isValidHexColor(hexColor) ? hexColor : '#E5E7EB' }}
          />
          בחר צבע
        </button>
        <input
          ref={colorInputRef}
          type="color"
          className="sr-only"
          value={displayHex}
          onChange={(e) => onHexChange(e.target.value.toUpperCase())}
          aria-label="בחירת צבע"
        />
        <input
          className={`${INPUT_CLASS} max-w-[140px] flex-1 font-mono text-sm`}
          dir="ltr"
          placeholder="#RRGGBB"
          value={hexColor}
          onChange={(e) => {
            const n = normalizeHexInput(e.target.value);
            if (n !== null) onHexChange(n.toUpperCase());
          }}
        />
      </div>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, angleRad: number) {
  return [cx + r * Math.cos(angleRad), cy + r * Math.sin(angleRad)] as const;
}

function InventoryPieChart({ items }: { items: Filament[] }) {
  const { segments, totalQty } = useMemo(() => {
    const withQty = items
      .map((f) => ({
        id: f.id,
        name: f.name,
        qty: Math.max(0, f.rollQuantity ?? 0),
        hex: isValidHexColor(f.hexColor) ? f.hexColor : '#94A3B8',
      }))
      .filter((x) => x.qty > 0);
    const totalQty = withQty.reduce((s, x) => s + x.qty, 0);
    return { segments: withQty, totalQty };
  }, [items]);

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 92;

  const paths = useMemo(() => {
    if (totalQty <= 0 || segments.length === 0) return [];
    let angle = -Math.PI / 2;
    return segments.map((seg) => {
      const sweep = (seg.qty / totalQty) * Math.PI * 2;
      const start = angle;
      const end = angle + sweep;
      angle = end;

      const [x1, y1] = polar(cx, cy, r, start);
      const [x2, y2] = polar(cx, cy, r, end);
      const largeArc = sweep > Math.PI ? 1 : 0;

      const d = [`M ${cx} ${cy}`, `L ${x1} ${y1}`, `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`, 'Z'].join(' ');

      return { id: seg.id, d, fill: seg.hex, name: seg.name, qty: seg.qty };
    });
  }, [segments, totalQty, cx, cy, r]);

  if (totalQty <= 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-12 text-center text-sm text-muted">
        <p className="font-semibold text-slate-600">אין נתוני כמות להצגה</p>
        <p className="text-xs">הוסיפו גלילים לפילמנטים כדי לראות התפלגות.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center md:gap-12">
      <div className="relative shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="drop-shadow-sm"
          role="img"
          aria-label="תרשים עוגה של התפלגות מלאי"
        >
          <title>התפלגות מלאי</title>
          {paths.map((p) => (
            <path
              key={p.id}
              d={p.d}
              fill={p.fill}
              stroke="white"
              strokeWidth={2}
              className="transition-opacity hover:opacity-90"
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-white/95 px-4 py-2 text-center shadow-sm ring-1 ring-slate-200/80">
            <p className="text-xl font-extrabold tabular-nums text-slate-900">{totalQty}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">גלילים</p>
          </div>
        </div>
      </div>
      <ul className="w-full max-w-sm space-y-2.5 text-sm md:min-w-[240px]">
        {segments.map((seg) => (
          <li
            key={seg.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-sm ring-1 ring-black/10"
                style={{ backgroundColor: seg.hex }}
              />
              <span className="truncate font-semibold text-slate-800">{seg.name}</span>
            </div>
            <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-slate-600" dir="ltr">
              {seg.qty} ({Math.round((seg.qty / totalQty) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
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

function buildUpdatePayload(patch: UpdateFilamentInput): Record<string, unknown> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.colorName !== undefined) payload.colorName = patch.colorName;
  if (patch.hexColor !== undefined) payload.hexColor = patch.hexColor;
  if (patch.materialType !== undefined) payload.materialType = patch.materialType;
  if (patch.available !== undefined) payload.available = patch.available;
  if (patch.sortOrder !== undefined) payload.sortOrder = patch.sortOrder;
  if (patch.priceModifier !== undefined) payload.priceModifier = patch.priceModifier;
  if (patch.isActive !== undefined) payload.isActive = patch.isActive;
  if (patch.isSportColor !== undefined) payload.isSportColor = patch.isSportColor;
  if (patch.rollQuantity !== undefined) {
    payload.quantity = patch.rollQuantity;
    payload.stockStatus = deriveStockStatusFromRolls(patch.rollQuantity);
  } else if (patch.stockStatus !== undefined) {
    payload.stockStatus = patch.stockStatus;
  }
  if (patch.stockWeightGrams !== undefined) payload.stockWeightGrams = patch.stockWeightGrams;
  if (patch.notes !== undefined) payload.notes = patch.notes;
  if (patch.imageUrl !== undefined) payload.imageUrl = patch.imageUrl;
  return payload;
}

export function FilamentsClient() {
  const db = useMemo(() => getFirebaseClientFirestore(), []);

  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [form, setForm] = useState<FilamentFormState | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [sortMode, setSortMode] = useState<'manual' | 'name-asc' | 'name-desc'>('manual');
  const [orderingBusy, setOrderingBusy] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const loadFilaments = useCallback(async () => {
    setListLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, FILAMENTS_COLLECTION));
      const list: Filament[] = [];
      snap.forEach((d) => {
        const f = supplyDocToFilament(d.id, d.data() as Record<string, unknown>);
        if (f) list.push(f);
      });
      setFilaments(sortFilaments(list));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שגיאת טעינה';
      setError(`טעינת פילמנטים נכשלה: ${msg}`);
      setFilaments([]);
    } finally {
      setListLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void loadFilaments();
  }, [loadFilaments]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filaments;
    return filaments.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.colorName.toLowerCase().includes(q) ||
        f.materialType.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q),
    );
  }, [filaments, search]);

  const displayedRows = useMemo(() => {
    const list = [...searched];
    if (sortMode === 'manual') {
      return list.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    if (sortMode === 'name-asc') {
      return list.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    }
    return list.sort((a, b) => b.name.localeCompare(a.name, 'he'));
  }, [searched, sortMode]);

  const canReorder = sortMode === 'manual' && search.trim() === '';

  function cycleSortMode() {
    setSortMode((m) => (m === 'manual' ? 'name-asc' : m === 'name-asc' ? 'name-desc' : 'manual'));
  }

  async function persistSortOrders(ordered: Filament[]) {
    setOrderingBusy(true);
    setError(null);
    try {
      const batch = writeBatch(db);
      ordered.forEach((f, index) => {
        batch.update(doc(db, FILAMENTS_COLLECTION, f.id), {
          sortOrder: index,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שמירת סדר נכשלה';
      setError(msg);
      await loadFilaments();
    } finally {
      setOrderingBusy(false);
    }
  }

  function handleDropRow(fromId: string, toId: string) {
    if (!canReorder || fromId === toId) return;
    const list = [...displayedRows];
    const fromIndex = list.findIndex((x) => x.id === fromId);
    const toIndex = list.findIndex((x) => x.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const reordered = reorderArray(list, fromIndex, toIndex);
    const withOrder = reordered.map((item, i) => ({ ...item, sortOrder: i }));
    const orderMap = new Map(withOrder.map((f) => [f.id, f.sortOrder]));
    setFilaments((prev) =>
      sortFilaments(prev.map((p) => (orderMap.has(p.id) ? { ...p, sortOrder: orderMap.get(p.id)! } : p))),
    );
    void persistSortOrders(withOrder);
  }

  const stats = useMemo(() => {
    const activeColors = filaments.filter((f) => f.isActive).length;
    const totalRolls = filaments.reduce((s, f) => s + (f.rollQuantity ?? 0), 0);
    const lowAlerts = filaments.filter((f) => (f.rollQuantity ?? 0) <= 1).length;
    return { activeColors, totalRolls, lowAlerts };
  }, [filaments]);

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

  function updateForm<K extends keyof FilamentFormState>(key: K, value: FilamentFormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function refreshDoc(id: string) {
    const snap = await getDoc(doc(db, FILAMENTS_COLLECTION, id));
    if (!snap.exists()) return;
    const next = supplyDocToFilament(id, snap.data() as Record<string, unknown>);
    if (next) {
      setFilaments((prev) => sortFilaments(prev.map((f) => (f.id === id ? next : f))));
    }
  }

  async function patchFilament(id: string, patch: UpdateFilamentInput) {
    setLoadingId(id);
    setError(null);
    try {
      const ref = doc(db, FILAMENTS_COLLECTION, id);
      await updateDoc(ref, buildUpdatePayload(patch));
      await refreshDoc(id);
      if (form && drawer?.mode === 'edit' && drawer.id === id) {
        const snap = await getDoc(ref);
        const updated = supplyDocToFilament(id, snap.data() as Record<string, unknown>);
        if (updated) setForm(buildFormFromFilament(updated));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'עדכון נכשל';
      setError(msg);
    } finally {
      setLoadingId(null);
    }
  }

  async function adjustRollQuantity(id: string, delta: number) {
    const f = filaments.find((x) => x.id === id);
    if (!f) return;
    const next = Math.max(0, f.rollQuantity + delta);
    const patch: UpdateFilamentInput = { rollQuantity: next };
    if (next === 0) {
      patch.available = false;
    } else if (f.rollQuantity === 0 && delta > 0) {
      patch.available = true;
    }
    await patchFilament(id, patch);
  }

  function openCreate() {
    setError(null);
    setForm({
      colorName: '',
      hexColor: '#FFFFFF',
      materialType: 'PLA',
      rollQuantity: 1,
      isSportColor: false,
      isActive: true,
    });
    setDrawer({ mode: 'create' });
  }

  function openEdit(f: Filament) {
    setError(null);
    setForm(buildFormFromFilament(f));
    setDrawer({ mode: 'edit', id: f.id });
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
    const label = form.colorName.trim();
    const hex = form.hexColor.trim().toUpperCase();

    try {
      if (drawer.mode === 'create') {
        const newId = newFilamentId();
        const rolls = form.rollQuantity;
        await setDoc(doc(db, FILAMENTS_COLLECTION, newId), {
          name: label,
          colorName: label,
          hexColor: hex,
          materialType: form.materialType,
          available: computeAvailableForSave(form, null, true),
          sortOrder: filaments.length,
          priceModifier: 0,
          isActive: form.isActive,
          quantity: rolls,
          isSportColor: form.isSportColor,
          stockStatus: deriveStockStatusFromRolls(rolls),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const prev = filaments.find((x) => x.id === drawer.id) ?? null;
        const rolls = form.rollQuantity;
        await updateDoc(doc(db, FILAMENTS_COLLECTION, drawer.id), {
          name: label,
          colorName: label,
          hexColor: hex,
          materialType: form.materialType,
          quantity: rolls,
          isSportColor: form.isSportColor,
          isActive: form.isActive,
          available: computeAvailableForSave(form, prev, false),
          stockStatus: deriveStockStatusFromRolls(rolls),
          updatedAt: serverTimestamp(),
        });
      }
      closeDrawer();
      await loadFilaments();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שמירה נכשלה';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function deleteFilament(id: string) {
    if (!window.confirm('למחוק פילמנט זה?')) return;
    setLoadingId(id);
    setError(null);
    try {
      await deleteDoc(doc(db, FILAMENTS_COLLECTION, id));
      setFilaments((prev) => prev.filter((f) => f.id !== id));
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
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">ניהול פילמנטים</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          נתונים בקולקציית <span dir="ltr">filaments</span> — עדכונים ישירים ב-Firestore.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label='סה"כ צבעים פעילים'
          value={stats.activeColors}
          sub="מסומנים כפעילים במערכת"
          accent="bg-slate-900 text-white"
        />
        <StatCard
          label="גלילים במלאי"
          value={stats.totalRolls}
          sub="סכום כל הגלילים בקטלוג"
          accent="bg-primary/15 text-primary"
        />
        <StatCard
          label="התראות מלאי"
          value={stats.lowAlerts}
          sub="פריטים עם ≤ 1 גליל"
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
            placeholder="חיפוש לפי שם, חומר או מזהה..."
            className={`${INPUT_CLASS} pr-10`}
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          הוסף פילמנט חדש
        </button>
      </div>

      <section className="rounded-[22px] border border-slate-200 bg-white shadow-sm">
        {listLoading ? (
          <div className="px-6 py-16 text-center text-muted">
            <p className="text-sm">טוען נתונים מ־filaments…</p>
          </div>
        ) : filaments.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted">
            <p className="font-semibold text-foreground">אין רשומות ב־filaments</p>
            <p className="mt-2 text-sm">הוסיפו צבע חדש מהכפתור למעלה.</p>
          </div>
        ) : displayedRows.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted">
            <p className="font-semibold text-foreground">לא נמצאו תוצאות</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full min-w-[920px] border-collapse text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="w-11 p-2 text-center align-middle" aria-label="גרירה לסידור" />
                  <th className="p-4 text-center align-middle">צבע</th>
                  <th className="p-4 text-right align-middle">
                    <button
                      type="button"
                      onClick={cycleSortMode}
                      className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-800"
                      title="מיון: ידני / א-ת / ת-א"
                    >
                      שם וגוון
                      {sortMode === 'manual' ? (
                        <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={2.2} />
                      ) : sortMode === 'name-asc' ? (
                        <ArrowUp className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={2.2} />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={2.2} />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-center align-middle">חומר</th>
                  <th className="p-4 text-center align-middle">מלאי</th>
                  <th className="p-4 text-center align-middle">מודלו ספורט</th>
                  <th className="p-4 text-center align-middle">גלוי ללקוחות</th>
                  <th className="p-4 text-center align-middle">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((f) => {
                  const loading = loadingId === f.id || orderingBusy;
                  const hex = isValidHexColor(f.hexColor) ? f.hexColor : '#E2E8F0';
                  const rolls = f.rollQuantity ?? 0;
                  const out = rolls === 0;
                  const isDragOver = canReorder && dragOverId === f.id && draggingId && draggingId !== f.id;
                  return (
                    <tr
                      key={f.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${loading ? 'opacity-60' : ''} ${
                        draggingId === f.id ? 'opacity-50' : ''
                      } ${isDragOver ? 'bg-blue-50/80 ring-1 ring-inset ring-blue-200' : ''}`}
                      onDragOver={(e) => {
                        if (!canReorder || !draggingId) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (draggingId !== f.id) setDragOverId(f.id);
                      }}
                      onDrop={(e) => {
                        if (!canReorder) return;
                        e.preventDefault();
                        const fromId = e.dataTransfer.getData('text/plain');
                        setDragOverId(null);
                        handleDropRow(fromId, f.id);
                      }}
                    >
                      <td className="w-11 p-2 align-middle text-center">
                        <span
                          data-drag-handle
                          draggable={canReorder}
                          onDragStart={(e) => {
                            if (!canReorder) return;
                            e.stopPropagation();
                            e.dataTransfer.setData('text/plain', f.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggingId(f.id);
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOverId(null);
                          }}
                          className={`inline-flex rounded-md p-1 ${
                            canReorder
                              ? 'cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing'
                              : 'cursor-not-allowed text-slate-200 opacity-50'
                          }`}
                          title={canReorder ? 'גרור לשינוי סדר' : 'מיון לפי שם או חיפוש — גרירה לא זמינה'}
                        >
                          <GripVertical className="h-5 w-5" strokeWidth={2} />
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex justify-center">
                          <div
                            className="h-10 w-10 rounded-full border border-white shadow-sm ring-1 ring-slate-200/80"
                            style={{ backgroundColor: hex }}
                          />
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <p className="font-bold text-slate-900">{f.name}</p>
                        <p className="font-mono text-[10px] text-slate-400" dir="ltr">
                          {f.id}
                        </p>
                      </td>
                      <td className="p-4 align-middle text-center font-semibold text-slate-700">
                        {f.materialType}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => adjustRollQuantity(f.id, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                              aria-label="הפחת גליל"
                            >
                              <Minus className="h-4 w-4" strokeWidth={2.2} />
                            </button>
                            <span className="min-w-[2rem] text-center text-base font-extrabold tabular-nums text-slate-900">
                              {rolls}
                            </span>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => adjustRollQuantity(f.id, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                              aria-label="הוסף גליל"
                            >
                              <Plus className="h-4 w-4" strokeWidth={2.2} />
                            </button>
                          </div>
                          {out ? (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-100">
                              אזל המלאי
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="overflow-visible p-4 align-middle">
                        <TableToggle
                          checked={f.isSportColor}
                          disabled={loading}
                          ariaLabel="מודלו ספורט"
                          onChange={(v) => patchFilament(f.id, { isSportColor: v })}
                        />
                      </td>
                      <td className="overflow-visible p-4 align-middle">
                        <TableToggle
                          checked={f.available && !out}
                          disabled={loading || out}
                          ariaLabel="גלוי ללקוחות"
                          onChange={(v) => patchFilament(f.id, { available: v })}
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => openEdit(f)}
                            className="rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            aria-label="עריכה"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => deleteFilament(f.id)}
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

      {!listLoading && filaments.length > 0 ? (
        <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-extrabold text-slate-900">התפלגות מלאי</h2>
            <p className="mt-1 text-sm text-slate-500">
              כל פרוסה = כמות גלילים לאותו צבע (משדה <span dir="ltr">quantity</span> ב-Firestore)
            </p>
          </div>
          <InventoryPieChart items={filaments} />
        </section>
      ) : null}

      {portalReady &&
        drawerOpen &&
        form &&
        createPortal(
          <div
            className="fixed inset-0 z-[100]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filament-drawer-title"
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
                <h2 id="filament-drawer-title" className="text-lg font-extrabold text-slate-900">
                  {isCreate ? 'הוספת פילמנט חדש' : 'עריכת פילמנט'}
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
                    <Field label="שם הצבע">
                      <input
                        className={INPUT_CLASS}
                        value={form.colorName}
                        onChange={(e) => updateForm('colorName', e.target.value)}
                        placeholder="למשל: לבן מט"
                      />
                    </Field>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <DrawerHexColorField
                        hexColor={form.hexColor}
                        onHexChange={(v) => updateForm('hexColor', v)}
                      />
                    </div>

                    <Field label="חומר">
                      <select
                        className={INPUT_CLASS}
                        value={form.materialType}
                        onChange={(e) => updateForm('materialType', e.target.value as FilamentMaterial)}
                      >
                        {MATERIALS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label={isCreate ? 'כמות נכנסת (גלילים)' : 'כמות גלילים במלאי'}>
                      <input
                        className={INPUT_CLASS}
                        dir="ltr"
                        type="number"
                        min={0}
                        step={1}
                        value={form.rollQuantity}
                        onChange={(e) =>
                          updateForm('rollQuantity', Math.max(0, Math.floor(Number(e.target.value) || 0)))
                        }
                      />
                    </Field>

                    <DrawerSwitch
                      label="זמין למודלו ספורט"
                      description="מוצג כבחירת צבע מסגרת במחלקת הספורט."
                      checked={form.isSportColor}
                      onToggle={(v) => updateForm('isSportColor', v)}
                    />
                    <DrawerSwitch
                      label="סטטוס פעיל"
                      description="צבע לא פעיל לא יוצע ללקוחות גם אם יש מלאי."
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
