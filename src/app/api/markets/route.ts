import { NextRequest } from 'next/server';
import { fail, json } from '@/lib/http';
import { listMarkets, listMarketsFast } from '@/lib/markets';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') ?? undefined;
    const symbols = url.searchParams.get('symbols')?.split(',').filter(Boolean);
    // `refresh=1` waits for provider fetches (used by admin tooling); the UI
    // path returns cached rows instantly and refreshes in the background.
    const blocking = url.searchParams.get('refresh') === '1';
    const markets = blocking
      ? await listMarkets({ category, symbols, refresh: true })
      : await listMarketsFast({ category, symbols });
    return json({ markets, fetchedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return fail(err);
  }
}
