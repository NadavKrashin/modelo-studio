import type {
  NormalizedModel,
  ModelSummary,
  Order,
  OrderStatus,
  Filament,
  FilamentOption,
  Category,
  AdminStats,
} from '@/lib/types';

// ─── Pagination ──────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SearchMeta {
  externalProvidersQueried: number;
  externalProvidersAvailable: number;
  externalResultCount: number;
  /** Dynamic category counts from the current result set (query+category filter). */
  categoryCounts?: Record<string, number>;
  localOnly: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  meta?: SearchMeta;
}

// ─── Model Repository ────────────────────────────────────────

export interface ModelRepository {
  findById(id: string): Promise<NormalizedModel | null>;
  findByExternalId(externalId: string, sourceName: string): Promise<NormalizedModel | null>;
  search(query: string, options: ModelSearchOptions): Promise<PaginatedResult<ModelSummary>>;
  findByCategory(categoryId: string, pagination: PaginationParams): Promise<PaginatedResult<ModelSummary>>;
  findPopular(limit: number): Promise<ModelSummary[]>;
  count(): Promise<number>;

  /** Write operations — used by ingestion pipeline */
  upsert(model: NormalizedModel): Promise<NormalizedModel>;
  bulkUpsert(models: NormalizedModel[]): Promise<number>;
  updateCacheState(id: string, state: NormalizedModel['cachedAssetState']): Promise<void>;
}

export interface ModelSearchOptions extends PaginationParams {
  category?: string;
  sortBy?: 'relevance' | 'popularity' | 'price_asc' | 'price_desc' | 'newest';
}

// ─── Order Repository ────────────────────────────────────────

export interface OrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByEmail(email: string): Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus, note?: string): Promise<Order | null>;
  list(options?: OrderListOptions): Promise<PaginatedResult<Order>>;
  countByStatus(): Promise<Record<OrderStatus, number>>;
}

export interface OrderListOptions extends PaginationParams {
  status?: OrderStatus;
  sortBy?: 'newest' | 'oldest' | 'total_asc' | 'total_desc';
}

// ─── Filament Repository ─────────────────────────────────────

export interface FilamentRepository {
  findAll(): Promise<Filament[]>;
  findById(id: string): Promise<Filament | null>;
  findAvailable(): Promise<FilamentOption[]>;
  findByMaterial(material: string): Promise<Filament[]>;
  updateStock(id: string, stockGrams: number): Promise<Filament | null>;
  setActive(id: string, active: boolean): Promise<Filament | null>;
}

// ─── Category Repository ─────────────────────────────────────

export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  findActive(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
  findById(id: string): Promise<Category | null>;
}

// ─── Analytics Repository ────────────────────────────────────

export interface AnalyticsRepository {
  getStats(): Promise<AdminStats>;
  recordSearchTerm(term: string): Promise<void>;
  recordOrderEvent(orderId: string, event: string): Promise<void>;
}
