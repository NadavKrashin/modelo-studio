import { collection, getDocs } from 'firebase/firestore';
import { getFirebaseClientFirestore } from '@/lib/firebase/client';
import { FILAMENTS_COLLECTION, supplyDocToFilament } from '@/lib/firebase/supply-tracker';
import type { Filament } from '@/lib/types';

/** Sport wizards: in-stock sport colors that are active and visible to customers. */
export function isEligibleSportFilament(f: Filament): boolean {
  return (
    f.isSportColor === true &&
    f.isActive === true &&
    f.available === true &&
    (f.rollQuantity ?? 0) > 0
  );
}

export async function fetchSportFilaments(): Promise<Filament[]> {
  const db = getFirebaseClientFirestore();
  const snap = await getDocs(collection(db, FILAMENTS_COLLECTION));
  const list: Filament[] = [];
  snap.forEach((d) => {
    const row = supplyDocToFilament(d.id, d.data() as Record<string, unknown>);
    if (row && isEligibleSportFilament(row)) list.push(row);
  });
  return list.sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Light swatches need a border so they stay visible on white. */
export function hexNeedsLightBorder(hex: string): boolean {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.82;
}
