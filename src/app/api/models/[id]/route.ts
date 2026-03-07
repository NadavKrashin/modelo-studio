import { NextResponse } from 'next/server';
import { getSearchService } from '@/lib/services/container';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
  }

  try {
    const searchService = getSearchService();
    const model = await searchService.getModel(id);

    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    return NextResponse.json(model);
  } catch (err) {
    console.error('[API] Model fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
