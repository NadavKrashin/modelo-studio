import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api/admin-auth';
import { getFilamentService } from '@/lib/services/container';
import { parseBody } from '@/lib/validation/api-helpers';
import { createFilamentSchema } from '@/lib/validation';

export async function GET() {
  const unauthorized = await requireAdminAuth();
  if (unauthorized) return unauthorized;

  try {
    const service = getFilamentService();
    const filaments = await service.getAllFilaments();
    return NextResponse.json(filaments);
  } catch (err) {
    console.error('[API] Admin filaments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminAuth();
  if (unauthorized) return unauthorized;

  const result = await parseBody(request, createFilamentSchema);
  if (result.error) return result.error;
  try {
    const service = getFilamentService();
    const created = await service.createFilament(result.data);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[API] Admin filament create error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
