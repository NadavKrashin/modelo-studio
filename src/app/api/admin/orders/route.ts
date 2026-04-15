import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api/admin-auth';
import { stripOrderLookupToken } from '@/lib/admin-session';
import { getOrderService } from '@/lib/services/container';
import { parseSearchParams } from '@/lib/validation/api-helpers';
import { adminOrdersQuerySchema } from '@/lib/validation';

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

    return NextResponse.json({
      ...orders,
      items: orders.items.map((o) => stripOrderLookupToken(o)),
    });
  } catch (err) {
    console.error('[API] Admin orders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
