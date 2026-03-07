import type { NormalizedModel } from '@/lib/types';

/**
 * Deduplication engine for search results.
 *
 * Supports:
 *  1. Exact dedup by externalId + source (same model from same provider)
 *  2. Cross-provider dedup by normalized name similarity
 *
 * When duplicates are found, the entry with the higher quality signal
 * (more images, higher popularity, richer metadata) is kept.
 */

export interface DeduplicationResult<T extends NormalizedModel> {
  unique: T[];
  duplicatesRemoved: number;
}

/**
 * Normalizes a model name for fuzzy comparison:
 * lowercases, strips punctuation, collapses whitespace.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function qualityScore(model: NormalizedModel): number {
  let score = 0;
  score += model.images.length * 5;
  score += model.tags.length * 2;
  score += model.popularityScore;
  if (model.description.length > 50) score += 10;
  if (model.printTimeMinutes) score += 5;
  if (model.previewAvailable) score += 10;
  return score;
}

/**
 * Computes a simple similarity ratio between two strings (Dice coefficient
 * on character bigrams). Returns 0–1 where 1 is identical.
 */
function bigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bigram = a.substring(i, i + 2);
    bigramsA.set(bigram, (bigramsA.get(bigram) ?? 0) + 1);
  }

  let intersectionSize = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bigram = b.substring(i, i + 2);
    const count = bigramsA.get(bigram);
    if (count && count > 0) {
      bigramsA.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2.0 * intersectionSize) / (a.length - 1 + b.length - 1);
}

const NAME_SIMILARITY_THRESHOLD = 0.85;

export function deduplicate<T extends NormalizedModel>(
  items: T[],
  options: { fuzzyNames?: boolean } = {},
): DeduplicationResult<T> {
  const { fuzzyNames = true } = options;

  // Phase 1: Exact dedup by source + externalId
  const seenExact = new Map<string, T>();
  const afterExact: T[] = [];

  for (const item of items) {
    const key = `${item.source.name}:${item.externalId}`;
    const existing = seenExact.get(key);
    if (existing) {
      if (qualityScore(item) > qualityScore(existing)) {
        seenExact.set(key, item);
        const idx = afterExact.indexOf(existing);
        if (idx >= 0) afterExact[idx] = item;
      }
    } else {
      seenExact.set(key, item);
      afterExact.push(item);
    }
  }

  if (!fuzzyNames) {
    return {
      unique: afterExact,
      duplicatesRemoved: items.length - afterExact.length,
    };
  }

  // Phase 2: Fuzzy name dedup across providers
  const result: T[] = [];
  const normalizedNames: string[] = [];

  for (const item of afterExact) {
    const norm = normalizeName(item.name);
    let isDuplicate = false;

    for (let i = 0; i < result.length; i++) {
      if (bigramSimilarity(norm, normalizedNames[i]) >= NAME_SIMILARITY_THRESHOLD) {
        if (qualityScore(item) > qualityScore(result[i])) {
          result[i] = item;
          normalizedNames[i] = norm;
        }
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      result.push(item);
      normalizedNames.push(norm);
    }
  }

  return {
    unique: result,
    duplicatesRemoved: items.length - result.length,
  };
}
