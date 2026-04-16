import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getOrderService } from '@/lib/services/container';
import { CLIENT_JWT_COOKIE, verifyClientJwt } from '@/lib/client-session';
import { stripOrderLookupToken } from '@/lib/admin-session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CLIENT_JWT_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyClientJwt(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderService = getOrderService();
    const order = await orderService.getById(session.orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(stripOrderLookupToken(order));
  } catch (err) {
    console.error('[API] Client order fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
