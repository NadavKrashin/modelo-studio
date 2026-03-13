import { NextResponse } from 'next/server';
import { getFilamentService } from '@/lib/services/container';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const isActive = !!body.isActive;

    const service = getFilamentService();
    const updated = await service.toggleFilamentActive(id, isActive);

    if (!updated) {
      return NextResponse.json({ error: 'Filament not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API] Filament toggle error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
