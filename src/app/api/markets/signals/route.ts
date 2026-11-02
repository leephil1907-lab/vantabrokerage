import { NextResponse } from 'next/server';
import { fetchProviderCandles, type Candle } from '@/lib/market-data';
import { prisma } from '@/lib/db';
import { computeSignals, type SignalSet } from '@/lib/indicators';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { at: number; data: SignalSet }>();
const TTL = 60_000;

/** GET /api/markets/signals?symbol=BTC/USDT — provider-derived technical lens. */
export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get('symbol')?.toUpperCase().trim();
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  const key = symbol;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json(hit.data, { headers: { 'Cache-Control': 'no-store' } });

  const pair = await prisma.tradingPair.findUnique({ where: { symbol }, select: { symbol: true, assetClass: true, dataSource: true, sourceSymbol: true, enabled: true } });
  if (!pair || !pair.enabled) return NextResponse.json({ error: 'unknown symbol' }, { status: 404 });

  let candles: Candle[] = [];
  try {
    candles = await fetchProviderCandles(
      { symbol: pair.symbol, assetClass: pair.assetClass, dataSource: pair.dataSource, sourceSymbol: pair.sourceSymbol },
      '1h',
      220,
    );
  } catch {
    candles = [];
  }
  if (candles.length < 60) {
    return NextResponse.json({ symbol, insufficient: true, computedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const data = computeSignals(symbol, '1h', candles);
  cache.set(key, { at: Date.now(), data });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
