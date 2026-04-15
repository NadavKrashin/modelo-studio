import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api/admin-auth';
import { getFilamentService } from '@/lib/services/container';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdminAuth();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  try {
    const body = await request.json();
    const available = !!body.available;
    if (typeof body.available !== 'boolean') {
      return NextResponse.json({ error: 'Invalid availability value' }, { status: 400 });
    }

    const service = getFilamentService();
    const updated = await service.toggleFilamentAvailability(id, available);

    if (!updated) {
      return NextResponse.json({ error: 'Filament not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API] Filament stock update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
