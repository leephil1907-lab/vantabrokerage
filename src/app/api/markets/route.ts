import { NextRequest } from 'next/server';
import { fail, json } from '@/lib/http';
import { listMarkets } from '@/lib/markets';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') ?? undefined;
    const symbols = url.searchParams.get('symbols')?.split(',').filter(Boolean);
    // Await the TTL-aware refresh so provider updates finish before the request
    // returns; detached work is not reliable in short-lived request runtimes.
    const blocking = url.searchParams.get('refresh') === '1';
    const markets = await listMarkets({ category, symbols, refresh: blocking });
    return json({ markets, fetchedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return fail(err);
  }
}
