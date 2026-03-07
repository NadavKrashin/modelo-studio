import type { ModelSourceProvider, SourceSearchOptions, ProviderResult } from '@/lib/types';

export abstract class BaseModelSourceProvider implements ModelSourceProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly displayName: string;

  abstract search(query: string, options?: SourceSearchOptions): Promise<ProviderResult[]>;
  abstract getModel(externalId: string): Promise<ProviderResult | null>;

  async isAvailable(): Promise<boolean> {
    return true;
  }
}
