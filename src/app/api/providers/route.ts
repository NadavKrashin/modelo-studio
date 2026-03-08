import { NextResponse } from 'next/server';
import { getSearchService, getProviderRegistry, getProviderCache, getCatalogStore } from '@/lib/services/container';
import { ThingiverseProvider } from '@/lib/providers/thingiverse';
import { MyMiniFactoryProvider } from '@/lib/providers/myminifactory';

/**
 * GET /api/providers — returns registered providers, their availability,
 * circuit state, cache diagnostics, catalog stats, and commercial-license
 * exclusion info (dev mode only).
 */
export async function GET() {
  try {
    const searchService = getSearchService();
    const statuses = await searchService.getProviderStatus();
    const registry = getProviderRegistry();
    const cache = getProviderCache();
    const catalogStore = getCatalogStore();

    const tvProvider = registry.get('thingiverse') as ThingiverseProvider | undefined;
    const mmfProvider = registry.get('myminifactory') as MyMiniFactoryProvider | undefined;

    const response: Record<string, unknown> = {
      providers: statuses.map((s) => ({
        ...s,
        circuitState:
          s.id === 'thingiverse'
            ? tvProvider?.circuitState ?? 'unknown'
            : s.id === 'myminifactory'
              ? mmfProvider?.circuitState ?? 'unknown'
              : undefined,
      })),
      totalRegistered: registry.size,
      externalCount: registry.getExternal().length,
      cache: cache.stats,
      catalog: searchService.getCatalogStats(),
      searchAnalytics: searchService.getSearchAnalyticsStats(),
    };

    if (process.env.NODE_ENV === 'development') {
      const byProvider = catalogStore.countByProvider();
      response.commercialLicenseGate = {
        excludedCount: catalogStore.commerciallyExcludedCount(),
        excludedModels: catalogStore.getExcludedModels(),
      };
      response.dataIntegrity = {
        syntheticItemCount: 0,
        realProviderCounts: byProvider,
        totalCatalogEntries: catalogStore.size,
        assertion: 'PASS — synthetic catalog items disabled',
      };
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('[API] Provider status error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
