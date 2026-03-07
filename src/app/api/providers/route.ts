import { NextResponse } from 'next/server';
import { getSearchService, getProviderRegistry, getProviderCache, getCatalogStore } from '@/lib/services/container';
import { ThingiverseProvider } from '@/lib/providers/thingiverse';

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

    const response: Record<string, unknown> = {
      providers: statuses.map((s) => ({
        ...s,
        circuitState: s.id === 'thingiverse' ? tvProvider?.circuitState ?? 'unknown' : undefined,
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
        mockItemCount: byProvider['local'] ?? 0,
        realProviderCounts: Object.fromEntries(
          Object.entries(byProvider).filter(([k]) => k !== 'local'),
        ),
        totalCatalogEntries: catalogStore.size,
        assertion: (byProvider['local'] ?? 0) === 0
          ? 'PASS — zero mock items in catalog'
          : `FAIL — ${byProvider['local']} mock items detected`,
      };
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('[API] Provider status error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
