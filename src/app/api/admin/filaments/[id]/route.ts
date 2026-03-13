import { NextResponse } from 'next/server';
import { getFilamentService } from '@/lib/services/container';
import { parseBody } from '@/lib/validation/api-helpers';
import { updateFilamentSchema } from '@/lib/validation';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await parseBody(request, updateFilamentSchema);
  if (result.error) return result.error;

  try {
    const service = getFilamentService();
    const updated = await service.updateFilament(id, result.data);
    if (!updated) {
      return NextResponse.json({ error: 'Filament not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API] Admin filament update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
