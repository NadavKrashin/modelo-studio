export const FIRESTORE_COLLECTIONS = {
  /** City catalog + pricing; admin CRUD + public list in cities wizard. */
  cities: 'cities',
  orders: 'orders',
  searchTerms: 'search_terms',
  orderEvents: 'order_events',
  modelCache: 'model_cache',
  /** Filament catalog + admin inventory (same collection as seed-filaments.mjs). */
  filaments: 'filaments',
  /** Discount / coupon codes (admin CRUD). Requires matching Firestore security rules. */
  coupons: 'coupons',
  /** Sport catalog for admin + future storefront listing. */
  sportProducts: 'sport-products',
  /** Legal / accessibility copy edited in admin (`terms`, `accessibility`). */
  siteContent: 'site-content',
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];
