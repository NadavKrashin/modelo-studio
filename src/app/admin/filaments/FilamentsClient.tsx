'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { CreateFilamentInput, Filament, FilamentMaterial, UpdateFilamentInput } from '@/lib/types';

const MATERIALS: FilamentMaterial[] = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon', 'Resin'];
const INPUT_CLASS =
  'w-full rounded-2xl border border-border bg-white px-3.5 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10';

interface Props {
  initialFilaments: Filament[];
}

interface FilamentFormState {
  id: string;
  name: string;
  colorName: string;
  hexColor: string;
  materialType: FilamentMaterial;
  available: boolean;
  sortOrder: number;
  priceModifier: number;
  isActive: boolean;
  notes: string;
}

interface SectionCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

interface StatCardProps {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
  accentClass: string;
}

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

interface StatusToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: (nextValue: boolean) => void;
}

interface ActionButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

const EMPTY_FORM: FilamentFormState = {
  id: '',
  name: '',
  colorName: '',
  hexColor: '#FFFFFF',
  materialType: 'PLA',
  available: true,
  sortOrder: 0,
  priceModifier: 0,
  isActive: true,
  notes: '',
};

function sortFilaments(items: Filament[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function buildFormFromFilament(filament: Filament): FilamentFormState {
  return {
    id: filament.id,
    name: filament.name,
    colorName: filament.colorName,
    hexColor: filament.hexColor,
    materialType: filament.materialType,
    available: filament.available,
    sortOrder: filament.sortOrder,
    priceModifier: filament.priceModifier ?? 0,
    isActive: filament.isActive,
    notes: filament.notes ?? '',
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

function validateFilamentForm(form: FilamentFormState) {
  if (!form.id.trim()) return 'יש להזין מזהה פנימי.';
  if (!form.name.trim()) return 'יש להזין שם תצוגה.';
  if (!form.colorName.trim()) return 'יש להזין שם צבע.';
  if (!isValidHexColor(form.hexColor)) return 'יש להזין קוד צבע תקין בפורמט HEX.';
  return null;
}

function buildCreatePayload(form: FilamentFormState): CreateFilamentInput {
  return {
    id: form.id.trim(),
    name: form.name.trim(),
    colorName: form.colorName.trim(),
    hexColor: form.hexColor.trim().toUpperCase(),
    materialType: form.materialType,
    available: form.available,
    sortOrder: form.sortOrder,
    priceModifier: form.priceModifier,
    isActive: form.isActive,
    notes: form.notes.trim() || undefined,
  };
}

function buildUpdatePayload(form: FilamentFormState): UpdateFilamentInput {
  return {
    name: form.name.trim(),
    colorName: form.colorName.trim(),
    hexColor: form.hexColor.trim().toUpperCase(),
    materialType: form.materialType,
    available: form.available,
    sortOrder: form.sortOrder,
    priceModifier: form.priceModifier,
    isActive: form.isActive,
    notes: form.notes.trim() || undefined,
  };
}

function formatPriceModifier(value: number) {
  if (value === 0) return 'ללא תוספת';
  const sign = value > 0 ? '+' : '-';
  return `${sign}₪${Math.abs(value).toLocaleString('he-IL')}`;
}

function formatRelativeCount(value: number, total: number) {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function SectionCard({ title, description, actions, children }: SectionCardProps) {
  return (
    <section className="rounded-[28px] border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DashboardStatCard({ label, value, description, icon, accentClass }: StatCardProps) {
  return (
    <div className="rounded-[26px] border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted">{label}</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
          <p className="mt-2 text-xs text-muted">{description}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: FieldProps) {
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

function ColorSwatch({ hexColor, title, subtitle }: { hexColor: string; title: string; subtitle?: string }) {
  const previewColor = isValidHexColor(hexColor) ? hexColor : '#E2E8F0';

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted-bg/50 p-3">
      <div
        className="h-14 w-14 shrink-0 rounded-2xl border border-white shadow-inner ring-1 ring-black/5"
        style={{ backgroundColor: previewColor }}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{title}</p>
        {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
        <p className="mt-1 text-xs font-semibold text-foreground/80" dir="ltr">
          {(hexColor || '#').toUpperCase()}
        </p>
      </div>
    </div>
  );
}

function StatusToggle({ label, description, checked, disabled, onToggle }: StatusToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onToggle(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-right transition-all ${
        checked
          ? 'border-primary/20 bg-primary/5'
          : 'border-border bg-white hover:border-gray-300'
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted">{description}</p>
      </div>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-gray-300'
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

function ActionButton({ label, icon, onClick, disabled }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/20 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      {label}
    </button>
  );
}

function FilamentStatusBadge({
  active,
  activeLabel,
  inactiveLabel,
  activeClass,
  inactiveClass,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  activeClass: string;
  inactiveClass: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
        active ? activeClass : inactiveClass
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export function FilamentsClient({ initialFilaments }: Props) {
  const [filaments, setFilaments] = useState(sortFilaments(initialFilaments));
  const [form, setForm] = useState<FilamentFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<FilamentFormState | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = filaments.length;
    const active = filaments.filter((f) => f.isActive).length;
    const available = filaments.filter((f) => f.available).length;

    return {
      total,
      active,
      available,
      hidden: total - available,
      inactive: total - active,
    };
  }, [filaments]);

  function updateForm<K extends keyof FilamentFormState>(key: K, value: FilamentFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateEditingForm<K extends keyof FilamentFormState>(key: K, value: FilamentFormState[K]) {
    setEditingForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function requestPatch(id: string, patch: UpdateFilamentInput) {
    const res = await fetch(`/api/admin/filaments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });

    if (!res.ok) throw new Error('PATCH_FAILED');
    return res.json() as Promise<Filament>;
  }

  async function createFilament() {
    const validationError = validateFilamentForm(form);
    setError(null);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCreating(true);

    try {
      const payload = buildCreatePayload(form);
      const res = await fetch('/api/admin/filaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('CREATE_FAILED');

      const created: Filament = await res.json();
      setFilaments((prev) => sortFilaments([...prev, created]));
      setForm(EMPTY_FORM);
    } catch {
      setError('יצירת הפילמנט נכשלה. נסו שוב בעוד רגע.');
    } finally {
      setIsCreating(false);
    }
  }

  async function patchFilament(id: string, patch: UpdateFilamentInput) {
    setLoadingId(id);
    setError(null);

    try {
      const updated = await requestPatch(id, patch);
      setFilaments((prev) => sortFilaments(prev.map((f) => (f.id === updated.id ? updated : f))));

      if (editingId === id) {
        setEditingForm(buildFormFromFilament(updated));
      }
    } catch {
      setError('עדכון הפילמנט נכשל. נסו שוב.');
    } finally {
      setLoadingId(null);
    }
  }

  async function saveEditing() {
    if (!editingId || !editingForm) return;

    const validationError = validateFilamentForm(editingForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    await patchFilament(editingId, buildUpdatePayload(editingForm));
  }

  async function moveSort(id: string, direction: -1 | 1) {
    const ordered = sortFilaments(filaments);
    const idx = ordered.findIndex((f) => f.id === id);
    const swapIdx = idx + direction;

    if (idx < 0 || swapIdx < 0 || swapIdx >= ordered.length) return;

    const current = ordered[idx]!;
    const swapWith = ordered[swapIdx]!;

    setLoadingId(id);
    setError(null);

    try {
      const [updatedCurrent, updatedSwap] = await Promise.all([
        requestPatch(current.id, { sortOrder: swapWith.sortOrder }),
        requestPatch(swapWith.id, { sortOrder: current.sortOrder }),
      ]);

      setFilaments((prev) =>
        sortFilaments(
          prev.map((filament) => {
            if (filament.id === updatedCurrent.id) return updatedCurrent;
            if (filament.id === updatedSwap.id) return updatedSwap;
            return filament;
          }),
        ),
      );
    } catch {
      setError('שינוי סדר התצוגה נכשל. נסו שוב.');
    } finally {
      setLoadingId(null);
    }
  }

  function startEditing(filament: Filament) {
    setEditingId(filament.id);
    setEditingForm(buildFormFromFilament(filament));
    setError(null);
  }

  function stopEditing() {
    setEditingId(null);
    setEditingForm(null);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">ניהול פילמנטים</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            מסך ניהול מרוכז לעדכון צבעים, חומרים, זמינות וסדר תצוגה. כל פילמנט מוצג ככרטיס נוח לסריקה, עריכה ושינוי סטטוס מהיר.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold text-muted">פילמנטים מנוהלים</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{stats.total}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          label="סה״כ פילמנטים"
          value={stats.total}
          description="כל הפריטים שמנוהלים כיום בקטלוג הייצור."
          accentClass="bg-blue-50 text-primary"
          icon={(
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0L21.75 12l-4.179 2.25m0 0L12 17.25l-5.571-3m11.142 0L21.75 16.5 12 21.75 2.25 16.5l4.179-2.25" />
            </svg>
          )}
        />
        <DashboardStatCard
          label="פילמנטים פעילים"
          value={stats.active}
          description={`${formatRelativeCount(stats.active, stats.total)} מהקטלוג מסומנים כפעילים לניהול ולהזמנות.`}
          accentClass="bg-emerald-50 text-success"
          icon={(
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          )}
        />
        <DashboardStatCard
          label="זמינים ללקוחות"
          value={stats.available}
          description={`${stats.hidden} פילמנטים מוסתרים כרגע מאזור הבחירה של הלקוחות.`}
          accentClass="bg-purple-50 text-secondary"
          icon={(
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12S5.25 5.25 12 5.25 21.75 12 21.75 12 18.75 18.75 12 18.75 2.25 12 2.25 12Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
            </svg>
          )}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <SectionCard
          title="יצירת פילמנט חדש"
          description="טופס מובנה ליצירת חומר או צבע חדש, עם חלוקה ברורה בין זיהוי, מאפייני צבע, תמחור וסטטוס."
          actions={
            <span className="rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
              יצירה מהירה
            </span>
          }
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-muted-bg/35 p-4 sm:p-5">
              <h3 className="text-sm font-bold text-foreground">פרטי זיהוי ותצוגה</h3>
              <div className="mt-4 grid gap-4">
                <Field label="מזהה פנימי" hint="למערכת">
                  <input
                    className={INPUT_CLASS}
                    dir="ltr"
                    placeholder="pla-white-matte"
                    value={form.id}
                    onChange={(e) => updateForm('id', e.target.value)}
                  />
                </Field>
                <Field label="שם תצוגה" hint="מופיע לצוות">
                  <input
                    className={INPUT_CLASS}
                    placeholder="לבן מט"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                  />
                </Field>
                <Field label="שם צבע" hint="לתיאור מהיר">
                  <input
                    className={INPUT_CLASS}
                    placeholder="לבן"
                    value={form.colorName}
                    onChange={(e) => updateForm('colorName', e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-muted-bg/35 p-4 sm:p-5">
              <h3 className="text-sm font-bold text-foreground">צבע וחומר</h3>
              <div className="mt-4 space-y-4">
                <ColorSwatch
                  hexColor={form.hexColor}
                  title={form.name.trim() || 'תצוגת צבע'}
                  subtitle={form.colorName.trim() || 'בחרו גוון והגדירו שם ברור'}
                />
                <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <Field label="בורר צבע">
                    <input
                      className="h-12 w-full cursor-pointer rounded-2xl border border-border bg-white p-1"
                      type="color"
                      value={isValidHexColor(form.hexColor) ? form.hexColor : '#FFFFFF'}
                      onChange={(e) => updateForm('hexColor', e.target.value.toUpperCase())}
                    />
                  </Field>
                  <Field label="קוד HEX" hint="לדוגמה #FFFFFF">
                    <input
                      className={INPUT_CLASS}
                      dir="ltr"
                      value={form.hexColor}
                      onChange={(e) => {
                        const nextValue = normalizeHexInput(e.target.value);
                        if (nextValue !== null) updateForm('hexColor', nextValue.toUpperCase());
                      }}
                    />
                  </Field>
                </div>
                <Field label="סוג חומר">
                  <select
                    className={INPUT_CLASS}
                    value={form.materialType}
                    onChange={(e) => updateForm('materialType', e.target.value as FilamentMaterial)}
                  >
                    {MATERIALS.map((material) => (
                      <option key={material} value={material}>
                        {material}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-muted-bg/35 p-4 sm:p-5">
              <h3 className="text-sm font-bold text-foreground">סדר ותמחור</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="סדר תצוגה">
                  <input
                    className={INPUT_CLASS}
                    type="number"
                    min={0}
                    step={1}
                    value={form.sortOrder}
                    onChange={(e) => updateForm('sortOrder', Number(e.target.value))}
                  />
                </Field>
                <Field label="תוספת מחיר" hint="בשקלים">
                  <input
                    className={INPUT_CLASS}
                    type="number"
                    step={1}
                    value={form.priceModifier}
                    onChange={(e) => updateForm('priceModifier', Number(e.target.value))}
                  />
                </Field>
              </div>
              <div className="mt-4 rounded-2xl border border-border bg-white px-4 py-3 text-sm">
                <p className="text-xs font-semibold text-muted">תצוגה מהירה</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted-bg px-3 py-1 text-xs font-semibold text-foreground">
                    סדר #{form.sortOrder}
                  </span>
                  <span className="rounded-full bg-muted-bg px-3 py-1 text-xs font-semibold text-foreground">
                    {formatPriceModifier(form.priceModifier)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-muted-bg/35 p-4 sm:p-5">
              <h3 className="text-sm font-bold text-foreground">נראות וסטטוס</h3>
              <div className="mt-4 space-y-3">
                <StatusToggle
                  label="זמין ללקוחות"
                  description="מופיע ללקוחות בבחירת הצבעים והחומרים."
                  checked={form.available}
                  onToggle={(nextValue) => updateForm('available', nextValue)}
                />
                <StatusToggle
                  label="פעיל במערכת"
                  description="נשמר כפריט פעיל לניהול, תמחור ושימוש."
                  checked={form.isActive}
                  onToggle={(nextValue) => updateForm('isActive', nextValue)}
                />
                <Field label="הערות פנימיות" hint="אופציונלי">
                  <textarea
                    className={`${INPUT_CLASS} min-h-[108px] resize-y`}
                    placeholder="למשל: מתאים להזמנות פרימיום או דורש בדיקת מלאי מיוחדת"
                    value={form.notes}
                    onChange={(e) => updateForm('notes', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-gray-950 px-4 py-4 text-white">
            <div>
              <p className="text-sm font-bold">הוספת פילמנט חדש לקטלוג</p>
              <p className="mt-1 text-xs text-gray-300">
                ההגדרות יישמרו מיד ויופיעו ברשימת הניהול עם כל פעולות העריכה והסידור.
              </p>
            </div>
            <button
              type="button"
              onClick={createFilament}
              disabled={isCreating}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? 'יוצר...' : 'יצירת פילמנט'}
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="תמונת מצב מהירה"
          description="סקירה קצרה של סטטוס הקטלוג כדי לזהות במהירות מה חסר, מה מוסתר ומה דורש טיפול."
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-3xl border border-border bg-muted-bg/50 p-4">
                <p className="text-xs font-semibold text-muted">מוסתרים מלקוחות</p>
                <p className="mt-2 text-2xl font-extrabold text-foreground">{stats.hidden}</p>
                <p className="mt-1 text-xs text-muted">פריטים שלא מוצגים כרגע בבחירת הלקוחות.</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted-bg/50 p-4">
                <p className="text-xs font-semibold text-muted">לא פעילים</p>
                <p className="mt-2 text-2xl font-extrabold text-foreground">{stats.inactive}</p>
                <p className="mt-1 text-xs text-muted">פריטים שמנוהלים אך אינם מסומנים כפעילים.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-white to-secondary/5 p-5">
              <h3 className="text-sm font-bold text-foreground">פירוש הסטטוסים</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-border bg-white/80 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">פעיל במערכת</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    מגדיר אם הפילמנט נחשב פעיל לניהול, שימוש פנימי ותמחור.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-white/80 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">זמין ללקוחות</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    שולט אם הלקוחות יכולים לבחור את הפילמנט בממשק ההזמנה.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="רשימת פילמנטים"
        description="כרטיסי ניהול ברורים לעריכה מהירה, שינוי סטטוסים וסידור לפי סדר תצוגה."
        actions={
          <span className="rounded-full bg-muted-bg px-3 py-1 text-xs font-semibold text-foreground">
            מסודר לפי סדר תצוגה
          </span>
        }
      >
        {filaments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted-bg/35 px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <svg className="h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">עדיין לא נוספו פילמנטים לקטלוג</p>
            <p className="mt-2 text-sm text-muted">צרו פילמנט חדש מהטופס למעלה כדי להתחיל לנהל את הקטלוג.</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filaments.map((filament, index) => {
              const isEditing = editingId === filament.id && editingForm !== null;
              const isLoading = loadingId === filament.id;

              return (
                <article
                  key={filament.id}
                  className={`rounded-[28px] border border-border bg-white p-5 shadow-sm transition-all ${
                    isLoading ? 'opacity-70' : 'hover:-translate-y-0.5 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ColorSwatch
                        hexColor={filament.hexColor}
                        title={filament.name}
                        subtitle={`${filament.colorName} • ${filament.materialType}`}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted-bg px-3 py-1 text-xs font-bold text-foreground">
                        סדר #{index + 1}
                      </span>
                      <ActionButton
                        label="למעלה"
                        disabled={isLoading || index === 0}
                        onClick={() => moveSort(filament.id, -1)}
                        icon={(
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m18 15-6-6-6 6" />
                          </svg>
                        )}
                      />
                      <ActionButton
                        label="למטה"
                        disabled={isLoading || index === filaments.length - 1}
                        onClick={() => moveSort(filament.id, 1)}
                        icon={(
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                          </svg>
                        )}
                      />
                      <ActionButton
                        label={isEditing ? 'סגור עריכה' : 'עריכה'}
                        disabled={isLoading}
                        onClick={() => (isEditing ? stopEditing() : startEditing(filament))}
                        icon={(
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125 16.875 4.5" />
                          </svg>
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <FilamentStatusBadge
                      active={filament.isActive}
                      activeLabel="פעיל"
                      inactiveLabel="לא פעיל"
                      activeClass="bg-emerald-50 text-emerald-700"
                      inactiveClass="bg-gray-100 text-gray-600"
                    />
                    <FilamentStatusBadge
                      active={filament.available}
                      activeLabel="גלוי ללקוחות"
                      inactiveLabel="מוסתר מלקוחות"
                      activeClass="bg-blue-50 text-blue-700"
                      inactiveClass="bg-amber-50 text-amber-700"
                    />
                    <span className="rounded-full bg-muted-bg px-2.5 py-1 text-[11px] font-bold text-foreground">
                      {formatPriceModifier(filament.priceModifier ?? 0)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-muted-bg/35 p-3.5">
                      <p className="text-[11px] font-semibold text-muted">מזהה פנימי</p>
                      <p className="mt-1 font-mono text-sm font-bold text-foreground" dir="ltr">
                        {filament.id}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted-bg/35 p-3.5">
                      <p className="text-[11px] font-semibold text-muted">סדר תצוגה</p>
                      <p className="mt-1 text-sm font-bold text-foreground">#{filament.sortOrder}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    <StatusToggle
                      label="זמין ללקוחות"
                      description={filament.available ? 'מוצג כרגע בתהליך ההזמנה.' : 'מוסתר כרגע ממסך הלקוח.'}
                      checked={filament.available}
                      disabled={isLoading}
                      onToggle={(nextValue) => patchFilament(filament.id, { available: nextValue })}
                    />
                    <StatusToggle
                      label="פעיל במערכת"
                      description={filament.isActive ? 'זמין לשימוש וניהול פנימי.' : 'מסומן כלא פעיל כרגע.'}
                      checked={filament.isActive}
                      disabled={isLoading}
                      onToggle={(nextValue) => patchFilament(filament.id, { isActive: nextValue })}
                    />
                  </div>

                  {filament.notes ? (
                    <div className="mt-4 rounded-2xl border border-border bg-muted-bg/35 px-4 py-3">
                      <p className="text-[11px] font-semibold text-muted">הערה פנימית</p>
                      <p className="mt-1 text-sm leading-6 text-foreground">{filament.notes}</p>
                    </div>
                  ) : null}

                  {isEditing && editingForm ? (
                    <div className="mt-5 rounded-3xl border border-primary/15 bg-primary/5 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-extrabold text-foreground">עריכת פילמנט</h3>
                          <p className="mt-1 text-xs text-muted">עדכון מרוכז של השדות העיקריים, הסטטוסים והתצוגה.</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">
                          {filament.id}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <Field label="שם תצוגה">
                          <input
                            className={INPUT_CLASS}
                            value={editingForm.name}
                            onChange={(e) => updateEditingForm('name', e.target.value)}
                          />
                        </Field>
                        <Field label="שם צבע">
                          <input
                            className={INPUT_CLASS}
                            value={editingForm.colorName}
                            onChange={(e) => updateEditingForm('colorName', e.target.value)}
                          />
                        </Field>
                        <Field label="סוג חומר">
                          <select
                            className={INPUT_CLASS}
                            value={editingForm.materialType}
                            onChange={(e) => updateEditingForm('materialType', e.target.value as FilamentMaterial)}
                          >
                            {MATERIALS.map((material) => (
                              <option key={material} value={material}>
                                {material}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="קוד HEX">
                          <input
                            className={INPUT_CLASS}
                            dir="ltr"
                            value={editingForm.hexColor}
                            onChange={(e) => {
                              const nextValue = normalizeHexInput(e.target.value);
                              if (nextValue !== null) updateEditingForm('hexColor', nextValue.toUpperCase());
                            }}
                          />
                        </Field>
                        <Field label="בורר צבע">
                          <input
                            className="h-12 w-full cursor-pointer rounded-2xl border border-border bg-white p-1"
                            type="color"
                            value={isValidHexColor(editingForm.hexColor) ? editingForm.hexColor : '#FFFFFF'}
                            onChange={(e) => updateEditingForm('hexColor', e.target.value.toUpperCase())}
                          />
                        </Field>
                        <Field label="סדר תצוגה">
                          <input
                            className={INPUT_CLASS}
                            type="number"
                            min={0}
                            step={1}
                            value={editingForm.sortOrder}
                            onChange={(e) => updateEditingForm('sortOrder', Number(e.target.value))}
                          />
                        </Field>
                        <Field label="תוספת מחיר" hint="בשקלים">
                          <input
                            className={INPUT_CLASS}
                            type="number"
                            step={1}
                            value={editingForm.priceModifier}
                            onChange={(e) => updateEditingForm('priceModifier', Number(e.target.value))}
                          />
                        </Field>
                        <div className="md:col-span-2">
                          <Field label="הערות פנימיות" hint="אופציונלי">
                            <textarea
                              className={`${INPUT_CLASS} min-h-[96px] resize-y`}
                              value={editingForm.notes}
                              onChange={(e) => updateEditingForm('notes', e.target.value)}
                            />
                          </Field>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 xl:grid-cols-2">
                        <StatusToggle
                          label="זמין ללקוחות"
                          description="שליטה ישירה על הנראות מול הלקוחות."
                          checked={editingForm.available}
                          disabled={isLoading}
                          onToggle={(nextValue) => updateEditingForm('available', nextValue)}
                        />
                        <StatusToggle
                          label="פעיל במערכת"
                          description="הגדרה אם הפילמנט פעיל לשימוש וניהול."
                          checked={editingForm.isActive}
                          disabled={isLoading}
                          onToggle={(nextValue) => updateEditingForm('isActive', nextValue)}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <ColorSwatch
                          hexColor={editingForm.hexColor}
                          title={editingForm.name || filament.name}
                          subtitle={editingForm.colorName || 'ללא שם צבע'}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={stopEditing}
                            className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted-bg"
                          >
                            ביטול
                          </button>
                          <button
                            type="button"
                            onClick={saveEditing}
                            disabled={isLoading}
                            className="rounded-2xl bg-foreground px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isLoading ? 'שומר...' : 'שמירת שינויים'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
