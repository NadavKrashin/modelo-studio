'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { getFirebaseClientFirestore } from '@/lib/firebase/client';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/firestore';
import {
  PRICING_SETTINGS_DEV_FALLBACK,
  PRICING_SETTINGS_DOC_ID,
} from '@/lib/firebase/pricing-settings-shared';

type FormKey =
  | 'personalCustomBasePrice'
  | 'acrylicCoverCost'
  | 'shippingCost'
  | 'bundleDiscountPerExtraCity';

const FIELD_META: { key: FormKey; label: string; hint?: string }[] = [
  {
    key: 'personalCustomBasePrice',
    label: 'מחיר בסיס — מודלו פרסונל',
    hint: 'מחיר בסיס לעולם הפרסונל (התאמה אישית)',
  },
  {
    key: 'acrylicCoverCost',
    label: 'תוספת כיסוי אקרילי',
    hint: 'עלות כיסוי תצוגה (למשל בחבילות סיטיז)',
  },
  {
    key: 'shippingCost',
    label: 'עלות משלוח בסיסית',
    hint: 'משלוח ברירת מחדל לחישובי הזמנה',
  },
  {
    key: 'bundleDiscountPerExtraCity',
    label: 'הנחת באנדל לכל עיר נוספת',
    hint: 'סכום הנחה (בש״ח) לכל עיר מעבר לראשונה בחבילת סיטיז',
  },
];

function parseNumber(raw: string): number | null {
  const n = Number(String(raw).replace(',', '.').trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function PricingSettingsClient() {
  const db = useMemo(() => getFirebaseClientFirestore(), []);
  const docRef = useMemo(
    () => doc(db, FIRESTORE_COLLECTIONS.settings, PRICING_SETTINGS_DOC_ID),
    [db],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [docExists, setDocExists] = useState(false);

  const [values, setValues] = useState<Record<FormKey, string>>(() => ({
    personalCustomBasePrice: String(PRICING_SETTINGS_DEV_FALLBACK.personalCustomBasePrice),
    acrylicCoverCost: String(PRICING_SETTINGS_DEV_FALLBACK.acrylicCoverCost),
    shippingCost: String(PRICING_SETTINGS_DEV_FALLBACK.shippingCost),
    bundleDiscountPerExtraCity: String(PRICING_SETTINGS_DEV_FALLBACK.bundleDiscountPerExtraCity),
  }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDoc(docRef);
      const f = PRICING_SETTINGS_DEV_FALLBACK;
      if (!snap.exists()) {
        setDocExists(false);
        setValues({
          personalCustomBasePrice: String(f.personalCustomBasePrice),
          acrylicCoverCost: String(f.acrylicCoverCost),
          shippingCost: String(f.shippingCost),
          bundleDiscountPerExtraCity: String(f.bundleDiscountPerExtraCity),
        });
        return;
      }
      setDocExists(true);
      const d = snap.data() as Record<string, unknown>;
      const num = (v: unknown, fb: number) => {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string' && v.trim() !== '') {
          const n = Number(v);
          if (Number.isFinite(n)) return n;
        }
        return fb;
      };
      setValues({
        personalCustomBasePrice: String(num(d.personalCustomBasePrice, f.personalCustomBasePrice)),
        acrylicCoverCost: String(num(d.acrylicCoverCost, f.acrylicCoverCost)),
        shippingCost: String(num(d.shippingCost, f.shippingCost)),
        bundleDiscountPerExtraCity: String(
          num(d.bundleDiscountPerExtraCity, f.bundleDiscountPerExtraCity),
        ),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'טעינה נכשלה');
    } finally {
      setLoading(false);
    }
  }, [docRef]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(false), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  async function handleSave() {
    setError(null);
    const payload: Record<FormKey, number> = {} as Record<FormKey, number>;
    for (const { key } of FIELD_META) {
      const n = parseNumber(values[key]);
      if (n === null) {
        setError('יש להזין מספרים תקינים (חיוביים) בכל השדות.');
        return;
      }
      payload[key] = n;
    }

    setSaving(true);
    try {
      const firePayload = {
        ...payload,
        updatedAt: serverTimestamp(),
      };
      if (docExists) {
        await updateDoc(docRef, firePayload);
      } else {
        await setDoc(docRef, firePayload, { merge: true });
        setDocExists(true);
      }
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שמירה נכשלה');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        <span className="text-sm font-medium">טוען הגדרות מחיר...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {success && (
        <div
          role="status"
          className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          ההגדרות נשמרו בהצלחה.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {FIELD_META.map(({ key, label, hint }) => (
          <div
            key={key}
            className="rounded-[20px] border border-border bg-white p-6 shadow-sm"
          >
            <label className="block space-y-2" htmlFor={key}>
              <span className="text-sm font-semibold text-foreground">{label}</span>
              {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
              <input
                id={key}
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={values[key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-border bg-white px-3.5 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </label>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 z-20 mt-10 rounded-2xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              שומר...
            </>
          ) : (
            'שמור שינויים'
          )}
        </button>
      </div>
    </div>
  );
}
