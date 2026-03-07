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

export interface CartItem {
  id: string;
  modelId: string;
  modelName: string;
  localizedModelName: string;
  thumbnailUrl: string;
  sourceName: string;
  sourceUrl?: string;
  customization: CustomizationOptions;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  addedAt: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  updatedAt: string;
}
