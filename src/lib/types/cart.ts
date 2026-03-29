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

export type CartItemKind = 'studio_model' | 'simple' | 'cities_bundle';

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

/** Multi-city bundle from the Cities wizard — single line item with nested city metadata. */
export interface CitiesBundleCartItem extends CartItemBase {
  kind: 'cities_bundle';
  title: string;
  imageUrl?: string;
  department: 'cities';
  productName: string;
  sizeKey: 'cube' | 'minicube';
  sizeLabel: string;
  frameColor: string;
  hasCover: boolean;
  coverPrice: number;
  /** ₪ discount applied for each city after the first (bundle pricing). */
  bundleDiscountPerExtraCity: number;
  cities: Array<{ name: string; slug: string; imageUrl?: string }>;
  attributes?: string[];
}

export type CartItem = StudioCartItem | SimpleCartItem | CitiesBundleCartItem;

/** Active coupon applied in the cart (mirrors Firestore `coupons` fields used at checkout). */
export interface AppliedCoupon {
  code: string;
  /** Same as Firestore `discountType`: `percent` or `fixed` (₪). */
  type: 'percent' | 'fixed';
  value: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  updatedAt: string;
}
