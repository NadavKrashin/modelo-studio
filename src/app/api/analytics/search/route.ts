import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api/admin-auth';
import { getSearchService } from '@/lib/services/container';

export async function GET() {
  const unauthorized = await requireAdminAuth();
  if (unauthorized) return unauthorized;

  try {
    const searchService = getSearchService();
    const stats = searchService.getSearchAnalyticsStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error('[API] Search analytics error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
