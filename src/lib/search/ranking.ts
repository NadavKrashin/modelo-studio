import type { NormalizedModel } from '@/lib/types';
import { analyzeQuery } from './query-analyzer';

/**
 * Bilingual ranking engine with field-weighted scoring.
 *
 * Scoring formula per item:
 *   finalScore = relevanceScore * 0.65 + popularityBoost * 0.25 + freshnessBoost * 0.10
 *
 * Items with zero relevance are filtered out when a query is present.
 * This prevents previously ingested models from contaminating unrelated queries.
 */

interface ScoringWeights {
  nameExact: number;
  namePartial: number;
  tagExact: number;
  tagPartial: number;
  categoryMatch: number;
  descriptionPartial: number;
}

const WEIGHTS: ScoringWeights = {
  nameExact: 15,
  namePartial: 8,
  tagExact: 10,
  tagPartial: 4,
  categoryMatch: 5,
  descriptionPartial: 2,
};

const MAX_FRESHNESS_DAYS = 365;
const MIN_RELEVANCE_THRESHOLD = 0.01;

export interface ScoredItem<T> {
  item: T;
  relevanceScore: number;
  finalScore: number;
}

export class KeywordPopularityRanking {
  rank<T extends NormalizedModel>(items: T[], query: string): T[] {
    if (!query.trim()) {
      return [...items].sort((a, b) => b.popularityScore - a.popularityScore);
    }

    const analyzed = analyzeQuery(query);
    const allTokens = analyzed.expandedTokens.length > 0
      ? analyzed.expandedTokens
      : analyzed.tokens;

    if (allTokens.length === 0) {
      return [...items].sort((a, b) => b.popularityScore - a.popularityScore);
    }

    return this.scoreAndFilter(items, allTokens, analyzed.normalized)
      .map((s) => s.item);
  }

  /**
   * Like rank(), but also returns relevance and final scores for each item.
   * Used by the SearchService for merging results from multiple sources.
   */
  rankWithScores<T extends NormalizedModel>(items: T[], query: string): ScoredItem<T>[] {
    if (!query.trim()) {
      return items.map((item) => ({
        item,
        relevanceScore: 0,
        finalScore: item.popularityScore / 100,
      }));
    }

    const analyzed = analyzeQuery(query);
    const allTokens = analyzed.expandedTokens.length > 0
      ? analyzed.expandedTokens
      : analyzed.tokens;

    if (allTokens.length === 0) {
      return items.map((item) => ({
        item,
        relevanceScore: 0,
        finalScore: item.popularityScore / 100,
      }));
    }

    return this.scoreAndFilter(items, allTokens, analyzed.normalized);
  }

  private scoreAndFilter<T extends NormalizedModel>(
    items: T[],
    tokens: string[],
    fullQuery: string,
  ): ScoredItem<T>[] {
    const now = Date.now();

    const scored: ScoredItem<T>[] = [];
    for (const item of items) {
      const relevance = computeRelevance(item, tokens, fullQuery);
      if (relevance < MIN_RELEVANCE_THRESHOLD) continue;

      const popularityBoost = Math.min(item.popularityScore, 100) / 100;
      const freshnessBoost = computeFreshness(item.createdAt, now);

      const finalScore = relevance * 0.65 + popularityBoost * 0.25 + freshnessBoost * 0.10;
      scored.push({ item, relevanceScore: relevance, finalScore });
    }

    scored.sort((a, b) => b.finalScore - a.finalScore);
    return scored;
  }
}

function computeRelevance(
  item: NormalizedModel,
  tokens: string[],
  fullQuery: string,
): number {
  let score = 0;
  const nameLower = item.name.toLowerCase();
  const localizedNameLower = item.localizedName.toLowerCase();
  const descLower = item.description.toLowerCase();
  const localizedDescLower = item.localizedDescription.toLowerCase();

  if (nameLower === fullQuery || localizedNameLower === fullQuery) {
    score += WEIGHTS.nameExact * 2;
  }

  for (const token of tokens) {
    if (nameLower === token || localizedNameLower === token) {
      score += WEIGHTS.nameExact;
    } else if (nameLower.includes(token) || localizedNameLower.includes(token)) {
      score += WEIGHTS.namePartial;
    }

    const exactTagMatch = item.tags.some((t) => t.toLowerCase() === token);
    if (exactTagMatch) {
      score += WEIGHTS.tagExact;
    } else if (item.tags.some((t) => t.toLowerCase().includes(token))) {
      score += WEIGHTS.tagPartial;
    }

    if (item.categories.some((c) => c.toLowerCase().includes(token))) {
      score += WEIGHTS.categoryMatch;
    }

    if (descLower.includes(token) || localizedDescLower.includes(token)) {
      score += WEIGHTS.descriptionPartial;
    }
  }

  const nameStartBonus = tokens.some(
    (t) => nameLower.startsWith(t) || localizedNameLower.startsWith(t),
  ) ? 5 : 0;

  return score + nameStartBonus;
}

function computeFreshness(createdAt: string, now: number): number {
  const created = new Date(createdAt).getTime();
  if (isNaN(created)) return 0.5;

  const ageMs = now - created;
  const ageDays = Math.max(0, ageMs / (1000 * 60 * 60 * 24));

  if (ageDays <= 0) return 1;
  if (ageDays >= MAX_FRESHNESS_DAYS) return 0;

  return 1 - ageDays / MAX_FRESHNESS_DAYS;
}
