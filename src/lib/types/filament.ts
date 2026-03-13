export type FilamentMaterial = 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'Nylon' | 'Resin';

export interface FilamentOption {
  id: string;
  name: string;
  localizedName: string;
  material: FilamentMaterial;
  colorHex: string;
  colorName: string;
  localizedColorName: string;
  priceModifier: number;
  inStock: boolean;
  isPopular: boolean;
}

export interface Filament {
  id: string;
  name: string;
  colorName: string;
  hexColor: string;
  materialType: FilamentMaterial;
  available: boolean;
  sortOrder: number;
  priceModifier: number;
  isActive: boolean;
  imageUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Backward-compatible aliases used by existing UI components.
  material: FilamentMaterial;
  colorHex: string;
  localizedColorName: string;
  inStock: boolean;
}

export interface CreateFilamentInput {
  id: string;
  name: string;
  colorName: string;
  hexColor: string;
  materialType: FilamentMaterial;
  available: boolean;
  sortOrder: number;
  priceModifier?: number;
  isActive?: boolean;
  imageUrl?: string;
  notes?: string;
}

export interface UpdateFilamentInput {
  name?: string;
  colorName?: string;
  hexColor?: string;
  materialType?: FilamentMaterial;
  available?: boolean;
  sortOrder?: number;
  priceModifier?: number;
  isActive?: boolean;
  imageUrl?: string;
  notes?: string;
}
