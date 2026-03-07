import { NextResponse } from 'next/server';
import { getSearchService } from '@/lib/services/container';

interface ClickBody {
  query?: string;
  modelId: string;
  position?: number;
  source?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ClickBody;

    if (!body.modelId) {
      return NextResponse.json({ error: 'modelId is required' }, { status: 400 });
    }

    const searchService = getSearchService();
    searchService.recordClick(
      body.query ?? '',
      body.modelId,
      body.position ?? 0,
      body.source ?? 'unknown',
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API] Click tracking error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
