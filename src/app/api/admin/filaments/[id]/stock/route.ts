import { NextResponse } from 'next/server';
import { getFilamentRepo } from '@/lib/services/container';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const stockGrams = Number(body.stockGrams);

    if (isNaN(stockGrams) || stockGrams < 0) {
      return NextResponse.json({ error: 'Invalid stock value' }, { status: 400 });
    }

    const filamentRepo = getFilamentRepo();
    const updated = await filamentRepo.updateStock(id, stockGrams);

    if (!updated) {
      return NextResponse.json({ error: 'Filament not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API] Filament stock update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
