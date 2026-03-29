import type {
  CreateFilamentInput,
  Filament,
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

function toOption(f: Filament): FilamentOption {
  return {
    id: f.id,
    name: f.name,
    localizedName: f.name,
    material: f.materialType,
    colorHex: f.hexColor,
    colorName: f.colorName,
    localizedColorName: f.colorName,
    priceModifier: f.priceModifier,
    inStock: f.rollQuantity > 0 && f.available,
    isPopular: f.sortOrder < 5,
  };
}

export class InMemoryFilamentRepository implements FilamentRepository {
  private items = new Map<string, Filament>();

  async findAll(): Promise<Filament[]> {
    return [...this.items.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findById(id: string): Promise<Filament | null> {
    return this.items.get(id) ?? null;
  }

  async findAvailable(): Promise<FilamentOption[]> {
    return [...this.items.values()]
      .filter((f) => f.available && f.isActive && f.rollQuantity > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toOption);
  }

  async create(input: CreateFilamentInput): Promise<Filament> {
    const now = new Date().toISOString();
    const rolls = input.rollQuantity ?? 0;
    const stockStatus = deriveStockStatus(rolls);
    const filament: Filament = {
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
      stockStatus,
      isSportColor: input.isSportColor ?? false,
      imageUrl: input.imageUrl,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
      material: input.materialType,
      colorHex: input.hexColor,
      localizedColorName: input.colorName,
      inStock: rolls > 0 && input.available,
    };
    this.items.set(filament.id, filament);
    return filament;
  }

  async update(id: string, patch: UpdateFilamentInput): Promise<Filament | null> {
    const current = this.items.get(id);
    if (!current) return null;
    const nextRolls = patch.rollQuantity !== undefined ? patch.rollQuantity : current.rollQuantity;
    const next: Filament = {
      ...current,
      ...patch,
      materialType: patch.materialType ?? current.materialType,
      hexColor: patch.hexColor ?? current.hexColor,
      colorName: patch.colorName ?? current.colorName,
      available: patch.available ?? current.available,
      sortOrder: patch.sortOrder ?? current.sortOrder,
      priceModifier: patch.priceModifier ?? current.priceModifier,
      isActive: patch.isActive ?? current.isActive,
      rollQuantity: nextRolls,
      stockWeightGrams:
        patch.stockWeightGrams !== undefined ? patch.stockWeightGrams : current.stockWeightGrams,
      stockStatus: deriveStockStatus(nextRolls),
      isSportColor: patch.isSportColor ?? current.isSportColor,
      updatedAt: new Date().toISOString(),
    };
    next.material = next.materialType;
    next.colorHex = next.hexColor;
    next.localizedColorName = next.colorName;
    next.inStock = nextRolls > 0 && next.available;
    this.items.set(id, next);
    return next;
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
    return this.items.delete(id);
  }
}
