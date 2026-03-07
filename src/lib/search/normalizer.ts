import type { ModelNormalizer, RawModelData, ModelSourceProvider, NormalizedModel } from '@/lib/types';
import { getLicense } from '@/lib/licenses';

/**
 * @deprecated Legacy normalizer for the old RawModelData → NormalizedModel pipeline.
 * The active code path uses provider-specific normalizers (e.g., normalizeThing)
 * that return typed ProviderResult objects.
 */
export class DefaultModelNormalizer implements ModelNormalizer {
  canNormalize(raw: RawModelData): boolean {
    return typeof raw.externalId === 'string' && typeof raw.sourceName === 'string';
  }

  normalize(raw: RawModelData, source: ModelSourceProvider): NormalizedModel {
    const data = raw as unknown as NormalizedModel & { sourceName: string };

    return {
      id: data.id ?? `${source.id}-${raw.externalId}`,
      externalId: raw.externalId,
      name: data.name ?? 'Untitled Model',
      localizedName: data.localizedName ?? data.name ?? 'מודל ללא שם',
      description: data.description ?? '',
      localizedDescription: data.localizedDescription ?? data.description ?? '',
      images: data.images ?? [],
      source: data.source ?? {
        id: source.id,
        name: source.name,
        displayName: source.displayName,
        baseUrl: '',
        attributionRequired: true,
      },
      sourceUrl: data.sourceUrl ?? '',
      license: data.license ?? getLicense('UNKNOWN'),
      categories: data.categories ?? [],
      tags: data.tags ?? [],
      popularityScore: data.popularityScore ?? 0,
      supportsEmbossedText: data.supportsEmbossedText ?? false,
      supportedMaterials: data.supportedMaterials ?? ['PLA'],
      defaultDimensions: data.defaultDimensions ?? { widthMm: 100, heightMm: 100, depthMm: 100 },
      previewAvailable: data.previewAvailable ?? false,
      cachedAssetState: data.cachedAssetState ?? 'none',
      availability: data.availability ?? 'available',
      estimatedBasePrice: data.estimatedBasePrice ?? 0,
      printTimeMinutes: data.printTimeMinutes,
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
      indexedAt: data.indexedAt ?? new Date().toISOString(),
    };
  }
}
