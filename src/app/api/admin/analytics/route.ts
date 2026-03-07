import { NextResponse } from 'next/server';
import { getAnalyticsRepo } from '@/lib/services/container';

export async function GET() {
  try {
    const analytics = getAnalyticsRepo();
    const stats = await analytics.getStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error('[API] Admin analytics error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
