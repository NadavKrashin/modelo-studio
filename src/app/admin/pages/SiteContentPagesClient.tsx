'use client';

import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseClientFirestore } from '@/lib/firebase/client';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/firestore';

const COLLECTION = FIRESTORE_COLLECTIONS.siteContent;

type Props = {
  termsDefault: string;
  accessibilityDefault: string;
};

export function SiteContentPagesClient({ termsDefault, accessibilityDefault }: Props) {
  const db = getFirebaseClientFirestore();
  const [terms, setTerms] = useState('');
  const [accessibility, setAccessibility] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'terms' | 'accessibility' | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const [tSnap, aSnap] = await Promise.all([
        getDoc(doc(db, COLLECTION, 'terms')),
        getDoc(doc(db, COLLECTION, 'accessibility')),
      ]);
      const t = tSnap.data()?.content;
      const a = aSnap.data()?.content;
      setTerms(typeof t === 'string' && t.length > 0 ? t : termsDefault);
      setAccessibility(typeof a === 'string' && a.length > 0 ? a : accessibilityDefault);
    } catch (e) {
      console.error('[SiteContentPages]', e);
      setTerms(termsDefault);
      setAccessibility(accessibilityDefault);
      setNotice({
        kind: 'err',
        text: e instanceof Error ? e.message : 'טעינה נכשלה — מוצג טקסט ברירת מחדל מקומית.',
      });
    } finally {
      setLoading(false);
    }
  }, [db, termsDefault, accessibilityDefault]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(id: 'terms' | 'accessibility') {
    const content = id === 'terms' ? terms : accessibility;
    setSaving(id);
    setNotice(null);
    try {
      await setDoc(
        doc(db, COLLECTION, id),
        { content, updatedAt: serverTimestamp() },
        { merge: true },
      );
      setNotice({ kind: 'ok', text: id === 'terms' ? 'תקנון נשמר בהצלחה.' : 'הצהרת הנגישות נשמרה בהצלחה.' });
    } catch (e) {
      setNotice({
        kind: 'err',
        text: e instanceof Error ? e.message : 'שמירה נכשלה',
      });
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
        טוען תוכן…
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {notice && (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            notice.kind === 'ok' ? 'bg-emerald-500/15 text-emerald-800' : 'bg-red-500/15 text-red-800'
          }`}
        >
          {notice.text}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">תקנון ומדיניות פרטיות</h2>
        <p className="text-sm text-muted-foreground">מזהה מסמך ב-Firestore: <code className="rounded bg-muted px-1.5 py-0.5">terms</code></p>
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={20}
          className="w-full whitespace-pre-wrap rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          dir="rtl"
        />
        <button
          type="button"
          onClick={() => save('terms')}
          disabled={saving !== null}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving === 'terms' ? 'שומר…' : 'שמור שינויים'}
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">הצהרת נגישות</h2>
        <p className="text-sm text-muted-foreground">מזהה מסמך ב-Firestore: <code className="rounded bg-muted px-1.5 py-0.5">accessibility</code></p>
        <textarea
          value={accessibility}
          onChange={(e) => setAccessibility(e.target.value)}
          rows={20}
          className="w-full whitespace-pre-wrap rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          dir="rtl"
        />
        <button
          type="button"
          onClick={() => save('accessibility')}
          disabled={saving !== null}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving === 'accessibility' ? 'שומר…' : 'שמור שינויים'}
        </button>
      </section>
    </div>
  );
}
