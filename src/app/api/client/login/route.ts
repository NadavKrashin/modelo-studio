import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getOrderService } from '@/lib/services/container';
import {
  CLIENT_JWT_COOKIE,
  createClientJwt,
  normalizePhone,
} from '@/lib/client-session';
import { stripOrderLookupToken } from '@/lib/admin-session';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.orderId !== 'string' || typeof body.phoneNumber !== 'string') {
      return NextResponse.json(
        { error: 'orderId and phoneNumber are required' },
        { status: 400 },
      );
    }

    const { orderId, phoneNumber } = body as { orderId: string; phoneNumber: string };
    const trimmedId = orderId.trim();
    const normalizedInput = normalizePhone(phoneNumber);

    if (!trimmedId || !normalizedInput) {
      return NextResponse.json(
        { error: 'orderId and phoneNumber are required' },
        { status: 400 },
      );
    }

    const orderService = getOrderService();
    const order = await orderService.lookup(trimmedId);

    if (!order) {
      return NextResponse.json(
        { error: 'ההזמנה לא נמצאה או מספר הטלפון אינו תואם' },
        { status: 401 },
      );
    }

    const normalizedStored = normalizePhone(order.customer.phone);
    if (normalizedStored !== normalizedInput) {
      return NextResponse.json(
        { error: 'ההזמנה לא נמצאה או מספר הטלפון אינו תואם' },
        { status: 401 },
      );
    }

    const token = await createClientJwt({
      orderId: order.id,
      orderNumber: order.orderNumber,
      phone: normalizedStored,
    });

    const cookieStore = await cookies();
    cookieStore.set(CLIENT_JWT_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      ok: true,
      order: stripOrderLookupToken(order),
    });
  } catch (err) {
    console.error('[API] Client login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
