import fs from 'fs';
import path from 'path';
import { getFirestoreAdmin, isFirebaseAdminConfigured } from '@/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/firestore';

const DEFAULT_FILES: Record<'terms' | 'accessibility', string> = {
  terms: 'terms-default.txt',
  accessibility: 'accessibility-default.txt',
};

function readLocalDefault(docId: 'terms' | 'accessibility'): string {
  const file = DEFAULT_FILES[docId];
  const full = path.join(process.cwd(), 'src/lib/content', file);
  return fs.readFileSync(full, 'utf8');
}

/**
 * Returns `site-content/{docId}` field `content`, or UTF-8 default text when missing / offline.
 */
export async function getSiteContent(docId: 'terms' | 'accessibility'): Promise<string> {
  const fallback = readLocalDefault(docId);

  if (!isFirebaseAdminConfigured()) {
    return fallback;
  }

  try {
    const snap = await getFirestoreAdmin()
      .collection(FIRESTORE_COLLECTIONS.siteContent)
      .doc(docId)
      .get();
    const raw = snap.data()?.content;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw;
    }
    return fallback;
  } catch (err) {
    console.error('[getSiteContent]', docId, err);
    return fallback;
  }
}
