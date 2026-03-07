import { NextResponse } from 'next/server';
import { getOrderService } from '@/lib/services/container';

export async function GET(
  _request: Request,
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

    return NextResponse.json(order);
  } catch (err) {
    console.error('[API] Order lookup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
