import type { Filament, FilamentOption } from '@/lib/types';
import type { FilamentRepository } from './interfaces';
import { FILAMENTS, FILAMENT_OPTIONS } from '@/lib/constants/filaments';

/**
 * In-memory filament repository.
 * Replace with PostgreSQL implementation for production.
 */
export class MockFilamentRepository implements FilamentRepository {
  private filaments: Filament[] = [...FILAMENTS];

  async findAll(): Promise<Filament[]> {
    return [...this.filaments];
  }

  async findById(id: string): Promise<Filament | null> {
    return this.filaments.find((f) => f.id === id) ?? null;
  }

  async findAvailable(): Promise<FilamentOption[]> {
    const activeIds = new Set(
      this.filaments.filter((f) => f.inStock && f.isActive).map((f) => f.id)
    );
    return FILAMENT_OPTIONS.filter((opt) => activeIds.has(opt.id));
  }

  async findByMaterial(material: string): Promise<Filament[]> {
    return this.filaments.filter((f) => f.material === material);
  }

  async updateStock(id: string, stockGrams: number): Promise<Filament | null> {
    const filament = this.filaments.find((f) => f.id === id);
    if (!filament) return null;

    filament.stockGrams = stockGrams;
    filament.inStock = stockGrams > filament.minStockThreshold;
    filament.updatedAt = new Date().toISOString();
    return { ...filament };
  }

  async setActive(id: string, active: boolean): Promise<Filament | null> {
    const filament = this.filaments.find((f) => f.id === id);
    if (!filament) return null;

    filament.isActive = active;
    filament.updatedAt = new Date().toISOString();
    return { ...filament };
  }
}
