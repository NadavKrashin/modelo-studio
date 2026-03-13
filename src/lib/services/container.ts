import { FirestoreOrderRepository } from '@/lib/repositories/firestore-order-repository';
import { FirestoreAnalyticsRepository } from '@/lib/repositories/firestore-analytics-repository';
import { FirestoreFilamentRepository } from '@/lib/repositories/firestore-filament-repository';
import { StaticCategoryRepository } from '@/lib/repositories/static-category-repository';
import { InMemoryOrderRepository } from '@/lib/repositories/in-memory-order-repository';
import { InMemoryAnalyticsRepository } from '@/lib/repositories/in-memory-analytics-repository';
import { InMemoryFilamentRepository } from '@/lib/repositories/in-memory-filament-repository';
import { OrderService } from './order-service';
import { PricingService } from './pricing-service';
import { FilamentService } from './filament-service';
import { SearchService } from './search-service';
import { ProviderRegistry, ProviderCache } from '@/lib/providers';
import { ThingiverseProvider } from '@/lib/providers/thingiverse';
import { MyMiniFactoryProvider } from '@/lib/providers/myminifactory';
import { getThingiverseConfig, getMyMiniFactoryConfig, validateProviderConfigs } from '@/lib/config/providers';
import { CatalogStore, CatalogService, FirestoreCatalogCache } from '@/lib/catalog';
import { InMemorySearchAnalytics } from '@/lib/search/search-analytics';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import type {
  OrderRepository,
  FilamentRepository,
  CategoryRepository,
  AnalyticsRepository,
} from '@/lib/repositories';
import type { SearchAnalyticsBackend } from '@/lib/search/search-backend';

const TAG = '[Container]';

class ServiceContainer {
  readonly orders: OrderRepository;
  readonly filaments: FilamentRepository;
  readonly categories: CategoryRepository;
  readonly analytics: AnalyticsRepository;

  readonly providerCache: ProviderCache;
  readonly providerRegistry: ProviderRegistry;

  readonly catalogStore: CatalogStore;
  readonly catalogService: CatalogService;
  readonly catalogPersistence: FirestoreCatalogCache | null;

  readonly searchAnalytics: SearchAnalyticsBackend;

  readonly orderService: OrderService;
  readonly pricingService: PricingService;
  readonly filamentService: FilamentService;
  readonly searchService: SearchService;

  constructor() {
    // ── Startup config validation ──────────────────────────
    const configWarnings = validateProviderConfigs();
    for (const w of configWarnings) {
      const log = w.level === 'error' ? console.error : console.warn;
      log(`${TAG} [${w.provider}] ${w.message}`);
    }
    const firebaseConfigured = isFirebaseAdminConfigured();
    if (!firebaseConfigured) {
      console.warn(
        `${TAG} Firebase Admin not configured; Firestore-backed persistence for orders/analytics/catalog cache is disabled until env vars are set.`,
      );
    }

    // ── Repositories ───────────────────────────────────────
    this.orders = firebaseConfigured ? new FirestoreOrderRepository() : new InMemoryOrderRepository();
    this.filaments = firebaseConfigured ? new FirestoreFilamentRepository() : new InMemoryFilamentRepository();
    this.categories = new StaticCategoryRepository();
    this.analytics = firebaseConfigured
      ? new FirestoreAnalyticsRepository(this.orders)
      : new InMemoryAnalyticsRepository(this.orders);

    // ── Provider infrastructure (real providers only) ──────
    this.providerCache = new ProviderCache();
    this.providerRegistry = new ProviderRegistry();

    const tvConfig = getThingiverseConfig();
    if (tvConfig.enabled) {
      const tvProvider = new ThingiverseProvider(tvConfig, this.providerCache);
      this.providerRegistry.register(tvProvider);
      tvProvider.warmUp();
      console.log(`${TAG} Thingiverse provider enabled (timeout=${tvConfig.requestTimeoutMs}ms, retries=${tvConfig.retry.maxRetries}, circuit-threshold=${tvConfig.circuitBreaker.failureThreshold})`);
    } else {
      console.log(`${TAG} Thingiverse provider disabled — set THINGIVERSE_API_TOKEN in .env.local to enable`);
    }

    const mmfConfig = getMyMiniFactoryConfig();
    if (mmfConfig.enabled) {
      const mmfProvider = new MyMiniFactoryProvider(mmfConfig, this.providerCache);
      this.providerRegistry.register(mmfProvider);
      mmfProvider.warmUp();
      console.log(`${TAG} MyMiniFactory provider enabled (timeout=${mmfConfig.requestTimeoutMs}ms, retries=${mmfConfig.retry.maxRetries}, circuit-threshold=${mmfConfig.circuitBreaker.failureThreshold})`);
    } else {
      console.log(`${TAG} MyMiniFactory provider disabled — set MYMINIFACTORY_API_KEY in .env.local to enable`);
    }

    // ── Catalog layer ──────────────────────────────────────
    this.catalogStore = new CatalogStore();
    this.catalogPersistence = firebaseConfigured ? new FirestoreCatalogCache() : null;
    this.catalogService = new CatalogService(this.catalogStore, this.providerRegistry, this.catalogPersistence ?? undefined);

    // ── Search analytics ───────────────────────────────────
    this.searchAnalytics = new InMemorySearchAnalytics();

    // ── Services ───────────────────────────────────────────
    this.filamentService = new FilamentService(this.filaments);
    this.pricingService = new PricingService(this.filaments);
    this.orderService = new OrderService(this.orders, this.pricingService, this.analytics);
    this.searchService = new SearchService(
      this.catalogStore,
      this.catalogService,
      this.analytics,
      this.searchAnalytics,
      this.providerRegistry,
    );

    const catalogStats = this.catalogService.getStats();
    const realProviders = this.providerRegistry.getExternal().map((p) => p.id);
    console.log(
      `${TAG} Initialized — ${this.providerRegistry.size} providers (real: ${realProviders.join(', ') || 'none'}), ` +
      `${catalogStats.totalEntries} catalog entries (${Object.entries(catalogStats.byProvider).map(([k, v]) => `${k}:${v}`).join(', ') || 'empty'}), ` +
      `${catalogStats.commerciallyExcluded} excluded by commercial-license gate, ` +
      `persistence=${this.catalogPersistence ? 'firestore' : 'in-memory-only (configure Firebase Admin env)'}`,
    );
  }

  logCacheStats(): void {
    console.log(`${TAG} Provider cache: ${this.providerCache.statsSummary()}`);
    console.log(`${TAG} Catalog: ${JSON.stringify(this.catalogService.getStats())}`);
    console.log(`${TAG} Search analytics: ${JSON.stringify(this.searchService.getSearchAnalyticsStats())}`);
  }
}

// ─── Singleton ──────────────────────────────────────────────

let instance: ServiceContainer | null = null;

export function getContainer(): ServiceContainer {
  if (!instance) {
    instance = new ServiceContainer();
  }
  return instance;
}

export const getOrderService = () => getContainer().orderService;
export const getPricingService = () => getContainer().pricingService;
export const getFilamentService = () => getContainer().filamentService;
export const getSearchService = () => getContainer().searchService;
export const getProviderRegistry = () => getContainer().providerRegistry;
export const getProviderCache = () => getContainer().providerCache;
export const getCatalogStore = () => getContainer().catalogStore;
export const getCatalogService = () => getContainer().catalogService;
export const getSearchAnalytics = () => getContainer().searchAnalytics;
export const getOrderRepo = () => getContainer().orders;
export const getFilamentRepo = () => getContainer().filaments;
export const getCategoryRepo = () => getContainer().categories;
export const getAnalyticsRepo = () => getContainer().analytics;
