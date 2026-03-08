import type { ModelSourceProvider, SourceSearchOptions, ProviderResult } from '@/lib/types';

/**
 * Provider registry — manages multiple model source providers.
 *
 * The registry is the single entry point for federated search:
 * it queries all enabled providers in parallel and returns typed
 * ProviderResult arrays that the CatalogService converts to CatalogEntries.
 *
 * Architecture:
 *   ┌───────────────┐
 *   │ SearchService  │
 *   └──────┬────────┘
 *          │ uses
 *   ┌──────▼────────┐       ┌──────────────┐
 *   │CatalogService │──────►│ CatalogStore  │
 *   └──────┬────────┘       └──────────────┘
 *          │ queries
 *   ┌──────▼────────┐
 *   │   Registry     │──► ThingiverseProvider
 *   │                │──► MyMiniFactoryProvider
 *   │                │──► PrintablesProvider (future)
 *   └───────────────┘
 */
export class ProviderRegistry {
  private providers = new Map<string, ModelSourceProvider>();

  register(provider: ModelSourceProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): ModelSourceProvider | undefined {
    return this.providers.get(id);
  }

  getAll(): ModelSourceProvider[] {
    return [...this.providers.values()];
  }

  async getAvailable(): Promise<ModelSourceProvider[]> {
    const checks = this.getAll().map(async (provider) => {
      try {
        const available = await Promise.race([
          provider.isAvailable(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000)),
        ]);
        return available ? provider : null;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(checks);
    return results.filter((p): p is ModelSourceProvider => p !== null);
  }

  getExternal(): ModelSourceProvider[] {
    return this.getAll();
  }

  /**
   * Browse popular/trending models from all providers when no search query.
   * Returns typed ProviderResult arrays keyed by provider ID.
   */
  async browseExternal(options?: SourceSearchOptions): Promise<Map<string, ProviderResult[]>> {
    const external = this.getExternal();
    const results = new Map<string, ProviderResult[]>();

    if (external.length === 0) return results;

    const browses = external.map(async (provider) => {
      try {
        if (typeof (provider as { browse?: (o?: SourceSearchOptions) => Promise<ProviderResult[]> }).browse !== 'function') {
          return { providerId: provider.id, results: [] as ProviderResult[] };
        }
        const isUp = await Promise.race([
          provider.isAvailable(),
          new Promise<boolean>((r) => setTimeout(() => r(false), 2000)),
        ]);
        if (!isUp) {
          console.warn(`[Registry] Provider "${provider.id}" not available for browse, skipping`);
          return { providerId: provider.id, results: [] as ProviderResult[] };
        }
        const providerResults = await (provider as { browse: (o?: SourceSearchOptions) => Promise<ProviderResult[]> }).browse(options);
        return { providerId: provider.id, results: providerResults };
      } catch (err) {
        console.warn(`[Registry] Browse failed for ${provider.id}:`, err);
        return { providerId: provider.id, results: [] as ProviderResult[] };
      }
    });

    const settled = await Promise.all(browses);
    for (const { providerId, results: providerResults } of settled) {
      if (providerResults.length > 0) {
        results.set(providerId, providerResults);
      }
    }

    return results;
  }

  /**
   * Searches across all available external providers in parallel.
   * Returns typed ProviderResult arrays keyed by provider ID.
   */
  async searchExternal(
    query: string,
    options?: SourceSearchOptions,
  ): Promise<Map<string, ProviderResult[]>> {
    const external = this.getExternal();
    const results = new Map<string, ProviderResult[]>();

    if (external.length === 0 || !query.trim()) return results;

    const searches = external.map(async (provider) => {
      try {
        const isUp = await Promise.race([
          provider.isAvailable(),
          new Promise<boolean>((r) => setTimeout(() => r(false), 2000)),
        ]);
        if (!isUp) {
          console.warn(`[Registry] Provider "${provider.id}" is not available, skipping`);
          return { providerId: provider.id, results: [] as ProviderResult[] };
        }

        const providerResults = await provider.search(query, options);
        return { providerId: provider.id, results: providerResults };
      } catch (err) {
        console.warn(`[Registry] Search failed for ${provider.id}:`, err);
        return { providerId: provider.id, results: [] as ProviderResult[] };
      }
    });

    const settled = await Promise.all(searches);
    for (const { providerId, results: providerResults } of settled) {
      if (providerResults.length > 0) {
        results.set(providerId, providerResults);
      }
    }

    return results;
  }

  get size(): number {
    return this.providers.size;
  }

  listProviders(): Array<{ id: string; name: string; displayName: string }> {
    return this.getAll().map((p) => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
    }));
  }
}
