import { NextResponse } from 'next/server';
import { stripOrderLookupToken } from '@/lib/admin-session';
import { requireAdminAuth } from '@/lib/api/admin-auth';
import { parseSearchParams } from '@/lib/validation/api-helpers';
import { adminOrdersQuerySchema } from '@/lib/validation';
import { getOrderService } from '@/lib/services/container';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const unauthorized = await requireAdminAuth();
  if (unauthorized) return unauthorized;

  const result = parseSearchParams(request.url, adminOrdersQuerySchema);
  if (result.error) return result.error;

  try {
    const orderService = getOrderService();
    const orders = await orderService.listOrders({
      status: result.data.status,
      page: result.data.page,
      pageSize: result.data.pageSize,
    });

    const items = Array.isArray(orders.items)
      ? orders.items.map((o) => stripOrderLookupToken(o))
      : [];

    return NextResponse.json({
      ...orders,
      items,
    });
  } catch (err) {
    console.error('[API Error] /api/admin/orders:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
