import { MockOrderRepository } from '@/lib/repositories/mock-order-repository';
import { MockFilamentRepository } from '@/lib/repositories/mock-filament-repository';
import { MockCategoryRepository } from '@/lib/repositories/mock-category-repository';
import { MockAnalyticsRepository } from '@/lib/repositories/mock-analytics-repository';
import { OrderService } from './order-service';
import { PricingService } from './pricing-service';
import { SearchService } from './search-service';
import { ProviderRegistry, ProviderCache } from '@/lib/providers';
import { ThingiverseProvider } from '@/lib/providers/thingiverse';
import { MyMiniFactoryProvider } from '@/lib/providers/myminifactory';
import { getThingiverseConfig, getMyMiniFactoryConfig, validateProviderConfigs } from '@/lib/config/providers';
import { CatalogStore, CatalogService } from '@/lib/catalog';
import { InMemorySearchAnalytics } from '@/lib/search/search-analytics';
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

  readonly searchAnalytics: SearchAnalyticsBackend;

  readonly orderService: OrderService;
  readonly pricingService: PricingService;
  readonly searchService: SearchService;

  constructor() {
    // ── Startup config validation ──────────────────────────
    const configWarnings = validateProviderConfigs();
    for (const w of configWarnings) {
      const log = w.level === 'error' ? console.error : console.warn;
      log(`${TAG} [${w.provider}] ${w.message}`);
    }

    // ── Repositories ───────────────────────────────────────
    this.orders = new MockOrderRepository();
    this.filaments = new MockFilamentRepository();
    this.categories = new MockCategoryRepository();
    this.analytics = new MockAnalyticsRepository(this.orders);

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
    this.catalogService = new CatalogService(this.catalogStore, this.providerRegistry);

    // ── Search analytics ───────────────────────────────────
    this.searchAnalytics = new InMemorySearchAnalytics();

    // ── Services ───────────────────────────────────────────
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
      `mock items: 0 (mock data removed)`,
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
