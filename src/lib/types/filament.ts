export type FilamentMaterial = 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'Nylon' | 'Resin';

/** Inventory level for admin tracking (stored in Firestore). */
export type FilamentStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

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
  /** Number of filament rolls in stock (primary inventory). */
  rollQuantity: number;
  /** Grams on spool / estimated remaining stock (optional). */
  stockWeightGrams?: number;
  /** Admin inventory bucket for badges; derived from roll quantity when syncing. */
  stockStatus: FilamentStockStatus;
  /** When true, this color is offered in Modelo Sport frame pickers. */
  isSportColor: boolean;
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
  rollQuantity?: number;
  stockWeightGrams?: number;
  stockStatus?: FilamentStockStatus;
  isSportColor?: boolean;
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
  rollQuantity?: number;
  stockWeightGrams?: number;
  stockStatus?: FilamentStockStatus;
  isSportColor?: boolean;
  imageUrl?: string;
  notes?: string;
}
