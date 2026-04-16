import { NextResponse } from 'next/server';
import { getFilamentService } from '@/lib/services/container';
import { parseBody } from '@/lib/validation/api-helpers';
import { createFilamentSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const service = getFilamentService();
    const filaments = await service.getAllFilaments();
    return NextResponse.json(Array.isArray(filaments) ? filaments : []);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API Error] /api/admin/filaments:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const result = await parseBody(request, createFilamentSchema);
  if (result.error) return result.error;
  try {
    const service = getFilamentService();
    const created = await service.createFilament(result.data);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API Error] /api/admin/filaments POST:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
