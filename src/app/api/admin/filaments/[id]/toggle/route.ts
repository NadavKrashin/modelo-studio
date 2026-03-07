import { NextResponse } from 'next/server';
import { getFilamentRepo } from '@/lib/services/container';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const isActive = !!body.isActive;

    const filamentRepo = getFilamentRepo();
    const updated = await filamentRepo.setActive(id, isActive);

    if (!updated) {
      return NextResponse.json({ error: 'Filament not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API] Filament toggle error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
