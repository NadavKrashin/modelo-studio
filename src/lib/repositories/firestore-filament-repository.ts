import { z } from 'zod';
import { getFirestoreAdmin } from '@/lib/firebase/admin';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/firestore';
import type {
  CreateFilamentInput,
  Filament,
  FilamentMaterial,
  FilamentOption,
  FilamentStockStatus,
  UpdateFilamentInput,
} from '@/lib/types';
import type { FilamentRepository } from './interfaces';

function deriveStockStatus(rolls: number): FilamentStockStatus {
  if (rolls <= 0) return 'out_of_stock';
  if (rolls <= 1) return 'low_stock';
  return 'in_stock';
}

const filamentRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  colorName: z.string().min(1),
  hexColor: z.string().regex(/^#([0-9a-fA-F]{6})$/),
  materialType: z.enum(['PLA', 'PETG', 'ABS', 'TPU', 'Nylon', 'Resin']),
  available: z.boolean(),
  sortOrder: z.number().int().min(0),
  priceModifier: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  rollQuantity: z.number().int().min(0).default(0),
  stockWeightGrams: z.number().int().min(0).optional(),
  stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock']).default('in_stock'),
  isSportColor: z.boolean().default(false),
  imageUrl: z.string().url().optional(),
  notes: z.string().max(500).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type FilamentRecord = z.infer<typeof filamentRecordSchema>;

function withoutUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const entries = Object.entries(obj).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}

function normalize(input: FilamentRecord): Filament {
  const rolls = input.rollQuantity;
  const stockStatus = deriveStockStatus(rolls);
  const inStock = rolls > 0 && input.available;
  return {
    ...input,
    rollQuantity: rolls,
    stockStatus,
    material: input.materialType,
    colorHex: input.hexColor,
    localizedColorName: input.colorName,
    inStock,
  };
}

function toOption(filament: Filament): FilamentOption {
  return {
    id: filament.id,
    name: filament.name,
    localizedName: filament.name,
    material: filament.materialType,
    colorHex: filament.hexColor,
    colorName: filament.colorName,
    localizedColorName: filament.colorName,
    priceModifier: filament.priceModifier ?? 0,
    inStock: filament.rollQuantity > 0 && filament.available,
    isPopular: filament.sortOrder < 5,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

export class FirestoreFilamentRepository implements FilamentRepository {
  private col() {
    return getFirestoreAdmin().collection(FIRESTORE_COLLECTIONS.filaments);
  }

  async findAll(): Promise<Filament[]> {
    const snap = await this.col().orderBy('sortOrder', 'asc').get();
    const out: Filament[] = [];
    for (const doc of snap.docs) {
      const parsed = filamentRecordSchema.safeParse(doc.data());
      if (!parsed.success) {
        console.warn('[Filaments] Invalid document skipped:', doc.id);
        continue;
      }
      out.push(normalize(parsed.data));
    }
    return out;
  }

  async findById(id: string): Promise<Filament | null> {
    const doc = await this.col().doc(id).get();
    if (!doc.exists) return null;
    const parsed = filamentRecordSchema.safeParse(doc.data());
    if (!parsed.success) {
      console.warn('[Filaments] Invalid filament document:', id);
      return null;
    }
    return normalize(parsed.data);
  }

  async findAvailable(): Promise<FilamentOption[]> {
    const snap = await this.col().orderBy('sortOrder', 'asc').get();
    const items: FilamentOption[] = [];
    for (const doc of snap.docs) {
      const parsed = filamentRecordSchema.safeParse(doc.data());
      if (!parsed.success) continue;
      const normalized = normalize(parsed.data);
      if (!normalized.isActive || !normalized.available || normalized.rollQuantity <= 0) continue;
      items.push(toOption(normalized));
    }
    return items;
  }

  async create(input: CreateFilamentInput): Promise<Filament> {
    const timestamp = nowIso();
    const rolls = input.rollQuantity ?? 0;
    const record: FilamentRecord = filamentRecordSchema.parse({
      id: input.id,
      name: input.name,
      colorName: input.colorName,
      hexColor: input.hexColor,
      materialType: input.materialType,
      available: input.available,
      sortOrder: input.sortOrder,
      priceModifier: input.priceModifier ?? 0,
      isActive: input.isActive ?? true,
      rollQuantity: rolls,
      stockWeightGrams: input.stockWeightGrams,
      stockStatus: deriveStockStatus(rolls),
      isSportColor: input.isSportColor ?? false,
      imageUrl: input.imageUrl,
      notes: input.notes,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await this.col().doc(record.id).set(withoutUndefined(record));
    return normalize(record);
  }

  async update(id: string, patch: UpdateFilamentInput): Promise<Filament | null> {
    const current = await this.findById(id);
    if (!current) return null;
    const nextRolls = patch.rollQuantity !== undefined ? patch.rollQuantity : current.rollQuantity;
    const merged = filamentRecordSchema.parse({
      id: current.id,
      name: patch.name ?? current.name,
      colorName: patch.colorName ?? current.colorName,
      hexColor: patch.hexColor ?? current.hexColor,
      materialType: (patch.materialType ?? current.materialType) as FilamentMaterial,
      available: patch.available ?? current.available,
      sortOrder: patch.sortOrder ?? current.sortOrder,
      priceModifier: patch.priceModifier ?? current.priceModifier,
      isActive: patch.isActive ?? current.isActive,
      rollQuantity: nextRolls,
      stockWeightGrams:
        patch.stockWeightGrams !== undefined ? patch.stockWeightGrams : current.stockWeightGrams,
      stockStatus: deriveStockStatus(nextRolls),
      isSportColor: patch.isSportColor ?? current.isSportColor,
      imageUrl: patch.imageUrl ?? current.imageUrl,
      notes: patch.notes ?? current.notes,
      createdAt: current.createdAt,
      updatedAt: nowIso(),
    });
    await this.col().doc(id).set(withoutUndefined(merged));
    return normalize(merged);
  }

  async setAvailability(id: string, available: boolean): Promise<Filament | null> {
    return this.update(id, { available });
  }

  async setSortOrder(id: string, sortOrder: number): Promise<Filament | null> {
    return this.update(id, { sortOrder });
  }

  async setActive(id: string, active: boolean): Promise<Filament | null> {
    return this.update(id, { isActive: active });
  }

  async delete(id: string): Promise<boolean> {
    const ref = this.col().doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }
}
