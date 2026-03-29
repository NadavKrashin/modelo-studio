import { z } from 'zod';

// ─── Search ──────────────────────────────────────────────────

export const searchQuerySchema = z.object({
  q: z.string().max(200).default(''),
  category: z.string().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sortBy: z
    .enum(['relevance', 'popularity', 'price_asc', 'price_desc', 'newest'])
    .default('relevance'),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

// ─── Model lookup ────────────────────────────────────────────

export const modelIdSchema = z.object({
  id: z.string().min(1, 'Model ID is required'),
});

// ─── Order creation ──────────────────────────────────────────

const customerDetailsSchema = z.object({
  fullName: z.string().min(2, 'שם מלא חייב להכיל לפחות 2 תווים').max(100),
  email: z.string().email('כתובת אימייל לא תקינה'),
  phone: z
    .string()
    .min(9, 'מספר טלפון לא תקין')
    .max(15)
    .regex(/^[\d\-+() ]+$/, 'מספר טלפון מכיל תווים לא חוקיים'),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  zipCode: z.string().max(10).optional(),
  deliveryNotes: z.string().max(500).optional(),
});

const dimensionsSchema = z.object({
  widthMm: z.number().min(0),
  heightMm: z.number().min(0),
  depthMm: z.number().min(0),
});

const referenceUploadSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileUrl: z.string(),
  mimeType: z.string(),
  uploadedAt: z.string(),
});

const customizationSchema = z.object({
  filamentId: z.string(),
  dimensions: dimensionsSchema,
  scale: z.number().min(0.5).max(3).default(1),
  embossedText: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  referenceImages: z.array(referenceUploadSchema).max(5).optional(),
});

const studioCartItemSchema = z.object({
  kind: z.literal('studio_model'),
  id: z.string(),
  modelId: z.string().min(1),
  modelName: z.string().min(1),
  localizedModelName: z.string().default(''),
  thumbnailUrl: z.string().default(''),
  sourceName: z.string().default('Modelo'),
  sourceUrl: z.string().optional(),
  customization: customizationSchema,
  quantity: z.number().int().min(1).max(100),
  unitPrice: z.number().min(0),
  subtotal: z.number().min(0),
  addedAt: z.string().default(new Date().toISOString()),
});

const simpleCartItemSchema = z.object({
  kind: z.literal('simple'),
  id: z.string(),
  title: z.string().min(1),
  imageUrl: z.string().optional(),
  department: z.enum(['cities', 'personal', 'sport', 'studio', 'other']).default('other'),
  attributes: z.array(z.string().max(200)).max(20).optional(),
  quantity: z.number().int().min(1).max(100),
  unitPrice: z.number().min(0),
  subtotal: z.number().min(0),
  addedAt: z.string().default(new Date().toISOString()),
});

const bundleCityEntrySchema = z.object({
  name: z.string(),
  slug: z.string(),
  imageUrl: z.string().optional(),
});

const citiesBundleCartItemSchema = z.object({
  kind: z.literal('cities_bundle'),
  id: z.string(),
  title: z.string().min(1),
  imageUrl: z.string().optional(),
  department: z.literal('cities'),
  productName: z.string(),
  sizeKey: z.enum(['cube', 'minicube']),
  sizeLabel: z.string(),
  frameColor: z.string(),
  hasCover: z.boolean(),
  coverPrice: z.number().min(0),
  bundleDiscountPerExtraCity: z.number().min(0),
  cities: z.array(bundleCityEntrySchema).min(1).max(50),
  attributes: z.array(z.string().max(300)).max(40).optional(),
  quantity: z.number().int().min(1).max(100),
  unitPrice: z.number().min(0),
  subtotal: z.number().min(0),
  addedAt: z.string().default(new Date().toISOString()),
});

const cartItemSchema = z.discriminatedUnion('kind', [
  studioCartItemSchema,
  simpleCartItemSchema,
  citiesBundleCartItemSchema,
]);

export const createOrderSchema = z.object({
  customer: customerDetailsSchema,
  items: z.array(cartItemSchema).min(1, 'העגלה ריקה'),
  deliveryMethod: z.enum(['shipping', 'pickup']),
  notes: z.string().max(1000).default(''),
  couponCode: z.string().max(40).optional(),
  /** Client-computed discount in ₪; server clamps to line subtotal. */
  discountAmount: z.number().min(0).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ─── Order lookup ────────────────────────────────────────────

export const orderLookupSchema = z.object({
  id: z.string().min(1, 'Order identifier is required'),
});

// ─── Order status update ─────────────────────────────────────

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    'received',
    'pending_approval',
    'in_production',
    'printed',
    'shipped',
    'completed',
  ]),
  note: z.string().max(500).optional(),
});

// ─── Price estimate ──────────────────────────────────────────

export const priceEstimateSchema = z.object({
  basePrice: z.number().min(0),
  sizeScale: z.number().min(0.5).max(3).optional(),
  filamentModifier: z.number().min(0.5).max(5).optional(),
  hasEmbossedText: z.boolean().optional(),
  quantity: z.coerce.number().int().min(1).max(100).optional(),
});

// ─── Admin filters ───────────────────────────────────────────

export const adminOrdersQuerySchema = z.object({
  status: z
    .enum([
      'received',
      'pending_approval',
      'in_production',
      'printed',
      'shipped',
      'completed',
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Filaments (admin) ──────────────────────────────────────

export const createFilamentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  colorName: z.string().min(1),
  hexColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'hexColor must be #RRGGBB'),
  materialType: z.enum(['PLA', 'PETG', 'ABS', 'TPU', 'Nylon', 'Resin']),
  available: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  priceModifier: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  rollQuantity: z.number().int().min(0).default(0),
  stockWeightGrams: z.number().int().min(0).optional(),
  stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock']).default('in_stock'),
  isSportColor: z.boolean().default(false),
  imageUrl: z.string().url().optional(),
  notes: z.string().max(500).optional(),
});

export const updateFilamentSchema = createFilamentSchema.partial().refine(
  (obj) => Object.keys(obj).length > 0,
  'At least one field is required',
);
