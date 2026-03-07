import { NextResponse } from 'next/server';
import { getOrderService } from '@/lib/services/container';
import { parseBody } from '@/lib/validation/api-helpers';
import { orderStatusUpdateSchema } from '@/lib/validation';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  const result = await parseBody(request, orderStatusUpdateSchema);
  if (result.error) return result.error;

  try {
    const orderService = getOrderService();
    const updated = await orderService.updateStatus(id, result.data.status, result.data.note);

    if (!updated) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API] Order status update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
