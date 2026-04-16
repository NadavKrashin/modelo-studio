import { NextResponse } from 'next/server';
import { getAnalyticsRepo } from '@/lib/services/container';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const analytics = getAnalyticsRepo();
    const stats = await analytics.getStats();

    console.log("Firestore fetch count:", stats.totalOrders);

    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API Error] /api/admin/analytics:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
