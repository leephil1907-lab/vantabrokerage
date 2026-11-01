import { NextRequest } from 'next/server';
import { fail, json } from '@/lib/http';
import { runScreener, SCREENER_MARKETS, SCREENER_PRESETS, type ScreenerMarket, type ScreenerPreset } from '@/lib/screener';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const market = (url.searchParams.get('market') ?? 'stocks') as ScreenerMarket;
    const preset = (url.searchParams.get('preset') ?? 'gainers') as ScreenerPreset;
    if (!SCREENER_MARKETS.includes(market)) return fail(new Error('Unknown screener market'));
    if (!SCREENER_PRESETS.includes(preset)) return fail(new Error('Unknown screener preset'));
    const page = Math.max(0, Number(url.searchParams.get('page') ?? 0) || 0);
    const size = Math.min(50, Math.max(10, Number(url.searchParams.get('size') ?? 25) || 25));
    const result = await runScreener(market, preset, page * size, size);
    return json({ market, preset, page, size, total: result.total, cached: result.cached, rows: result.rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) { return fail(err); }
}
