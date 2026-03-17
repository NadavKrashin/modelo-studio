import { SearchPageClient } from '@/components/search/SearchPageClient';

export const dynamic = 'force-dynamic';

/**
 * Search page — renders SearchPageClient which fetches from /api/search
 * and displays results + dynamic category counts from the same source of truth.
 * All state is driven by URL params (q, category, page); no stale server data.
 */
export default function SearchPage() {
  return <SearchPageClient />;
}
