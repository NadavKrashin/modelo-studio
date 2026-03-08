import type { Firestore } from 'firebase-admin/firestore';
import { getFirestoreAdmin } from '@/lib/firebase/admin';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/firestore';
import type { CatalogEntry } from '@/lib/types';

const MAX_CACHE_SCAN = 1000;

export class FirestoreCatalogCache {
  private db: Firestore | null = null;

  private getDb(): Firestore {
    if (this.db) return this.db;
    this.db = getFirestoreAdmin();
    return this.db;
  }

  async upsertEntries(entries: CatalogEntry[]): Promise<void> {
    if (entries.length === 0) return;
    const batch = this.getDb().batch();
    for (const entry of entries) {
      const ref = this.getDb().collection(FIRESTORE_COLLECTIONS.modelCache).doc(entry.id);
      batch.set(ref, entry);
    }
    await batch.commit();
  }

  async upsertEntry(entry: CatalogEntry): Promise<void> {
    await this.getDb().collection(FIRESTORE_COLLECTIONS.modelCache).doc(entry.id).set(entry);
  }

  async findById(id: string): Promise<CatalogEntry | null> {
    const snap = await this.getDb().collection(FIRESTORE_COLLECTIONS.modelCache).doc(id).get();
    return snap.exists ? (snap.data() as CatalogEntry) : null;
  }

  async countByProvider(): Promise<Record<string, number>> {
    const snap = await this.getDb().collection(FIRESTORE_COLLECTIONS.modelCache).limit(MAX_CACHE_SCAN).get();
    const counts: Record<string, number> = {};
    for (const doc of snap.docs) {
      const entry = doc.data() as CatalogEntry;
      const providerId = entry.catalog?.providerId ?? 'unknown';
      counts[providerId] = (counts[providerId] ?? 0) + 1;
    }
    return counts;
  }
}
