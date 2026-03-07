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
  material: FilamentMaterial;
  brand: string;
  colorHex: string;
  colorName: string;
  localizedColorName: string;
  pricePerGram: number;
  stockGrams: number;
  minStockThreshold: number;
  inStock: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
