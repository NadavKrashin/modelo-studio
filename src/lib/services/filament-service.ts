import type {
  CreateFilamentInput,
  Filament,
  FilamentOption,
  UpdateFilamentInput,
} from '@/lib/types';
import type { FilamentRepository } from '@/lib/repositories';

export class FilamentService {
  constructor(private readonly repo: FilamentRepository) {}

  getAllFilaments(): Promise<Filament[]> {
    return this.repo.findAll();
  }

  getAvailableFilaments(): Promise<FilamentOption[]> {
    return this.repo.findAvailable();
  }

  getFilamentById(id: string): Promise<Filament | null> {
    return this.repo.findById(id);
  }

  async getAllFilamentOptions(): Promise<FilamentOption[]> {
    const all = await this.repo.findAll();
    return all
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((f) => ({
        id: f.id,
        name: f.name,
        localizedName: f.name,
        material: f.materialType,
        colorHex: f.hexColor,
        colorName: f.colorName,
        localizedColorName: f.colorName,
        priceModifier: f.priceModifier,
        inStock: f.available,
        isPopular: f.sortOrder < 5,
      }));
  }

  createFilament(input: CreateFilamentInput): Promise<Filament> {
    return this.repo.create(input);
  }

  updateFilament(id: string, patch: UpdateFilamentInput): Promise<Filament | null> {
    return this.repo.update(id, patch);
  }

  toggleFilamentAvailability(id: string, available: boolean): Promise<Filament | null> {
    return this.repo.setAvailability(id, available);
  }

  toggleFilamentActive(id: string, isActive: boolean): Promise<Filament | null> {
    return this.repo.setActive(id, isActive);
  }

  reorderFilament(id: string, sortOrder: number): Promise<Filament | null> {
    return this.repo.setSortOrder(id, sortOrder);
  }
}
