import type { Filament, FilamentMaterial, FilamentStockStatus } from '@/lib/types';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/firestore';

export const FILAMENTS_COLLECTION = FIRESTORE_COLLECTIONS.filaments;

export function deriveStockStatusFromRolls(rolls: number): FilamentStockStatus {
  if (rolls <= 0) return 'out_of_stock';
  if (rolls <= 1) return 'low_stock';
  return 'in_stock';
}

function toIso(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function asMaterial(v: unknown): FilamentMaterial {
  const m = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon', 'Resin'] as const;
  const s = typeof v === 'string' ? v : 'PLA';
  return (m.includes(s as FilamentMaterial) ? s : 'PLA') as FilamentMaterial;
}

/** Map a `filaments` document to the shared `Filament` shape (`quantity` / `rollQuantity` → `rollQuantity`). */
export function supplyDocToFilament(docId: string, raw: Record<string, unknown>): Filament | null {
  const name =
    typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim()
      : typeof raw.colorName === 'string' && raw.colorName.trim()
        ? raw.colorName.trim()
        : null;
  if (!name) return null;

  const qtyRaw = raw.quantity ?? raw.rollQuantity;
  const rolls =
    typeof qtyRaw === 'number' && Number.isFinite(qtyRaw)
      ? Math.max(0, Math.floor(qtyRaw))
      : Math.max(0, Math.floor(Number(qtyRaw) || 0));

  const hex =
    typeof raw.hexColor === 'string' && /^#([0-9a-fA-F]{6})$/.test(raw.hexColor.trim())
      ? raw.hexColor.trim().toUpperCase()
      : '#000000';

  const colorName =
    typeof raw.colorName === 'string' && raw.colorName.trim() ? raw.colorName.trim() : name;
  const materialType = asMaterial(raw.materialType);
  const available = typeof raw.available === 'boolean' ? raw.available : true;
  const sortOrder =
    typeof raw.sortOrder === 'number' && Number.isFinite(raw.sortOrder)
      ? Math.max(0, Math.floor(raw.sortOrder))
      : 0;
  const priceModifier =
    typeof raw.priceModifier === 'number' && Number.isFinite(raw.priceModifier)
      ? Math.max(0, raw.priceModifier)
      : 0;
  const isActive = typeof raw.isActive === 'boolean' ? raw.isActive : true;
  const isSportColor = typeof raw.isSportColor === 'boolean' ? raw.isSportColor : false;

  const stockStatus = deriveStockStatusFromRolls(rolls);
  const createdAt = toIso(raw.createdAt);
  const updatedAt = toIso(raw.updatedAt);

  return {
    id: docId,
    name,
    colorName,
    hexColor: hex,
    materialType,
    available,
    sortOrder,
    priceModifier,
    isActive,
    rollQuantity: rolls,
    stockStatus,
    isSportColor,
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : undefined,
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    createdAt,
    updatedAt,
    material: materialType,
    colorHex: hex,
    localizedColorName: colorName,
    inStock: rolls > 0 && available,
  };
}
