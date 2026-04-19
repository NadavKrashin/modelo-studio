import { NextResponse } from 'next/server';
import { stripOrderLookupToken } from '@/lib/admin-session';
import { requireAdminAuth } from '@/lib/api/admin-auth';
import { getOrderService, getSearchService } from '@/lib/services/container';
import { OrderPricingError } from '@/lib/services/order-service';
import { parseBody, parseSearchParams } from '@/lib/validation/api-helpers';
import { createOrderSchema, adminOrdersQuerySchema } from '@/lib/validation';

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
    console.error('[API] Orders list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const result = await parseBody(request, createOrderSchema);
  if (result.error) return result.error;

  try {
    const searchService = getSearchService();
    for (const item of result.data.items) {
      if (item.kind === 'studio_model') {
        const model = await searchService.getModel(item.modelId);
        if (!model) {
          return NextResponse.json(
            { error: `Model "${item.modelId}" is not available for commercial use` },
            { status: 403 },
          );
        }
      }
    }

    const orderService = getOrderService();
    const confirmation = await orderService.create({
      customer: result.data.customer,
      items: result.data.items,
      deliveryMethod: result.data.deliveryMethod,
      notes: result.data.notes,
      couponCode: result.data.couponCode,
    });

    return NextResponse.json(confirmation, { status: 201 });
  } catch (err) {
    if (err instanceof OrderPricingError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[API] Order creation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
