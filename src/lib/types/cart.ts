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
  /** Client display estimate; server recomputes on checkout (ignored in order schema). */
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
  /** Firestore `sport-products.slug` — required for `department: 'sport'` at checkout. */
  sportProductSlug?: string;
  /** When true, adds route frame add-on from `settings/pricing` (משושה מסלול). */
  sportWantsFrame?: boolean;
  /** City document slug — optional if `attributes[0]` is Hebrew name (legacy). */
  citySlug?: string;
  citySizeKey?: 'cube' | 'minicube';
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
  /** @deprecated Ignored at checkout; use Firestore `settings/pricing`. */
  coverPrice?: number;
  /** @deprecated Ignored at checkout; use Firestore `settings/pricing`. */
  bundleDiscountPerExtraCity?: number;
  cities: Array<{ name: string; slug: string; imageUrl?: string }>;
  attributes?: string[];
}

export type CartItem = StudioCartItem | SimpleCartItem | CitiesBundleCartItem;

/** Use this for `addItem` — `Omit<CartItem, …>` does not distribute correctly over unions in TypeScript. */
export type NewCartItem =
  | Omit<StudioCartItem, 'id' | 'addedAt'>
  | Omit<SimpleCartItem, 'id' | 'addedAt'>
  | Omit<CitiesBundleCartItem, 'id' | 'addedAt'>;

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
