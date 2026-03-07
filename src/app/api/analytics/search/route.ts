import { NextResponse } from 'next/server';
import { getSearchService } from '@/lib/services/container';

export async function GET() {
  try {
    const searchService = getSearchService();
    const stats = searchService.getSearchAnalyticsStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error('[API] Search analytics error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
