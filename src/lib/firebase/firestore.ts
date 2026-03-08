export const FIRESTORE_COLLECTIONS = {
  orders: 'orders',
  searchTerms: 'search_terms',
  orderEvents: 'order_events',
  modelCache: 'model_cache',
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];
