import { NextRequest } from 'next/server';
import { fail, json } from '@/lib/http';
import { listDisplayMarkets } from '@/lib/markets';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Read-only public quote feed. This route never writes to MarketQuote and is
 * not used by the order execution service.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') ?? undefined;
    const symbols = url.searchParams.get('symbols')?.split(',').filter(Boolean);
    const markets = await listDisplayMarkets({ category, symbols });
    return json(
      { markets, fetchedAt: new Date().toISOString(), mode: 'display-only' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return fail(err);
  }
}
