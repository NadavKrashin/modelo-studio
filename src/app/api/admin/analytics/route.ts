import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api/admin-auth';
import { getAnalyticsRepo } from '@/lib/services/container';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const unauthorized = await requireAdminAuth();
  if (unauthorized) return unauthorized;

  try {
    const analytics = getAnalyticsRepo();
    const stats = await analytics.getStats();

    console.log("Firestore fetch count:", stats.totalOrders);

    return NextResponse.json(stats);
  } catch (err) {
    console.error('[API Error] /api/admin/analytics:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
