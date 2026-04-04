import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  ADMIN_JWT_COOKIE,
  stripOrderLookupToken,
  verifyAdminJwt,
} from '@/lib/admin-session';
import { getOrderService } from '@/lib/services/container';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Order identifier is required' }, { status: 400 });
  }

  try {
    const orderService = getOrderService();
    const order = await orderService.lookup(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_JWT_COOKIE)?.value;
    const isAdmin = adminToken ? await verifyAdminJwt(adminToken) : false;

    if (isAdmin) {
      return NextResponse.json(stripOrderLookupToken(order));
    }

    const url = new URL(request.url);
    const lookupToken = url.searchParams.get('token')?.trim() ?? '';
    const stored = order.customerLookupToken;

    if (!stored) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const a = Buffer.from(lookupToken, 'utf8');
    const b = Buffer.from(stored, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(stripOrderLookupToken(order));
  } catch (err) {
    console.error('[API] Order lookup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
