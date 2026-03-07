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

const cartItemSchema = z.object({
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

export const createOrderSchema = z.object({
  customer: customerDetailsSchema,
  items: z.array(cartItemSchema).min(1, 'העגלה ריקה'),
  deliveryMethod: z.enum(['shipping', 'pickup']),
  notes: z.string().max(1000).default(''),
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
