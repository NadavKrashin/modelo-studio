'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { LegalContentParagraphs } from '@/components/legal/LegalContentParagraphs';
import { getFirebaseClientFirestore } from '@/lib/firebase/client';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/firestore';

export default function AccessibilityPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const db = getFirebaseClientFirestore();
        const snap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.siteContent, 'accessibility'));
        const raw = snap.data()?.content;
        if (!cancelled) {
          setContent(typeof raw === 'string' ? raw : '');
        }
      } catch (error) {
        console.error('[accessibility/page] Failed to load site content:', error);
        if (!cancelled) setContent('');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <main className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            הצהרת נגישות
          </h1>
          <div className="w-24 h-1 bg-black mx-auto rounded-full"></div>
        </div>

        <article className="text-slate-700 leading-relaxed text-lg space-y-10">
          {loading ? (
            <p className="text-slate-500">טוען תוכן...</p>
          ) : content.trim().length > 0 ? (
            <LegalContentParagraphs content={content} paragraphClassName="mb-2" />
          ) : (
            <p className="text-slate-500">התוכן אינו זמין כרגע.</p>
          )}
        </article>
      </main>
    </div>
  );
}
