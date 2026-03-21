import type { ModelDimensions } from './model';

export interface CustomizationOptions {
  filamentId: string;
  dimensions: ModelDimensions;
  scale: number;
  embossedText?: string;
  notes?: string;
  referenceImages?: ReferenceUpload[];
}

export interface ReferenceUpload {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  uploadedAt: string;
}

export type CartItemKind = 'studio_model' | 'simple';

export interface CartItemBase {
  id: string;
  kind: CartItemKind;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  addedAt: string;
}

export interface StudioCartItem extends CartItemBase {
  kind: 'studio_model';
  modelId: string;
  modelName: string;
  localizedModelName: string;
  thumbnailUrl: string;
  sourceName: string;
  sourceUrl?: string;
  customization: CustomizationOptions;
}

export interface SimpleCartItem extends CartItemBase {
  kind: 'simple';
  title: string;
  imageUrl?: string;
  department: 'cities' | 'personal' | 'sport' | 'studio' | 'other';
  attributes?: string[];
}

export type CartItem = StudioCartItem | SimpleCartItem;

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  updatedAt: string;
}
