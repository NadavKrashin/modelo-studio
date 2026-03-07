import { NextResponse } from 'next/server';
import { getCategoryRepo, getSearchService } from '@/lib/services/container';

export async function GET() {
  try {
    const categoryRepo = getCategoryRepo();
    const searchService = getSearchService();
    const categories = await categoryRepo.findActive();
    const counts = searchService.getCategoryCounts();

    const enriched = categories.map((cat) => ({
      ...cat,
      modelCount: counts[cat.id] ?? 0,
    }));

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('[API] Categories fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
