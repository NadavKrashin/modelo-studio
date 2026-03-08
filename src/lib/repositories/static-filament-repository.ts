import type { Filament, FilamentOption } from '@/lib/types';
import type { FilamentRepository } from './interfaces';
import { FILAMENTS, FILAMENT_OPTIONS } from '@/lib/constants/filaments';

export class StaticFilamentRepository implements FilamentRepository {
  private filaments: Filament[] = [...FILAMENTS];

  async findAll(): Promise<Filament[]> {
    return [...this.filaments];
  }

  async findById(id: string): Promise<Filament | null> {
    return this.filaments.find((filament) => filament.id === id) ?? null;
  }

  async findAvailable(): Promise<FilamentOption[]> {
    const activeIds = new Set(
      this.filaments.filter((filament) => filament.inStock && filament.isActive).map((filament) => filament.id),
    );
    return FILAMENT_OPTIONS.filter((option) => activeIds.has(option.id));
  }

  async findByMaterial(material: string): Promise<Filament[]> {
    return this.filaments.filter((filament) => filament.material === material);
  }

  async updateStock(id: string, stockGrams: number): Promise<Filament | null> {
    const filament = this.filaments.find((item) => item.id === id);
    if (!filament) return null;
    filament.stockGrams = stockGrams;
    filament.inStock = stockGrams > filament.minStockThreshold;
    filament.updatedAt = new Date().toISOString();
    return { ...filament };
  }

  async setActive(id: string, active: boolean): Promise<Filament | null> {
    const filament = this.filaments.find((item) => item.id === id);
    if (!filament) return null;
    filament.isActive = active;
    filament.updatedAt = new Date().toISOString();
    return { ...filament };
  }
}
