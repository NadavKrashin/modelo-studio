import { z } from 'zod';
import { getFirestoreAdmin } from '@/lib/firebase/admin';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/firestore';
import type {
  CreateFilamentInput,
  Filament,
  FilamentMaterial,
  FilamentOption,
  UpdateFilamentInput,
} from '@/lib/types';
import type { FilamentRepository } from './interfaces';

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
  return {
    ...input,
    material: input.materialType,
    colorHex: input.hexColor,
    localizedColorName: input.colorName,
    inStock: input.available,
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
    inStock: filament.available,
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
      if (!normalized.isActive || !normalized.available) continue;
      items.push(toOption(normalized));
    }
    return items;
  }

  async create(input: CreateFilamentInput): Promise<Filament> {
    const timestamp = nowIso();
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
}
