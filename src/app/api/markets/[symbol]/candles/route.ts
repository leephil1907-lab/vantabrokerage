import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { AppError } from '@/lib/errors';
import { fetchProviderCandles, INTERVALS, type Interval } from '@/lib/market-data';
import { d } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

const CANDLE_CACHE_MS = 45_000;

export async function GET(req: NextRequest, ctx: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await ctx.params;
    const sym = decodeURIComponent(symbol);
    const url = new URL(req.url);
    const interval = (url.searchParams.get('interval') ?? '5m') as Interval;
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 300), 500);
    if (!INTERVALS.includes(interval)) throw new AppError('INVALID_INTERVAL', 'Unsupported chart interval.', 400);

    const pair = await prisma.tradingPair.findUnique({ where: { symbol: sym } });
    if (!pair) throw new AppError('NOT_FOUND', 'Market not found.', 404);

    const cached = await prisma.priceCandle.findMany({ where: { pairId: pair.id, interval }, orderBy: { openTime: 'desc' }, take: limit });
    const latest = cached[0];
    if (latest && Date.now() - latest.openTime.getTime() < CANDLE_CACHE_MS && cached.length >= Math.min(limit, 60)) {
      return json({ symbol: sym, interval, source: latest.source, cached: true, candles: cached.reverse().map(toCandle) });
    }

    const candles = await fetchProviderCandles(pair, interval, limit);
    if (candles.length) {
      await prisma.$transaction(
        candles.map((c) =>
          prisma.priceCandle.upsert({
            where: { pairId_interval_openTime: { pairId: pair.id, interval, openTime: new Date(c.time * 1000) } },
            create: {
              pairId: pair.id,
              interval,
              openTime: new Date(c.time * 1000),
              closeTime: new Date((c.time + (interval === '1d' ? 86400 : interval === '4h' ? 14400 : interval === '1h' ? 3600 : interval === '15m' ? 900 : interval === '5m' ? 300 : 60)) * 1000),
              open: String(c.open), high: String(c.high), low: String(c.low), close: String(c.close), volume: String(c.volume ?? 0), source: pair.dataSource,
            },
            update: { close: String(c.close), high: String(c.high), low: String(c.low), volume: String(c.volume ?? 0) },
          }),
        ),
      ).catch((e) => console.error('[candle persist]', e));
    }
    return json({ symbol: sym, interval, source: pair.dataSource, cached: false, candles });
  } catch (err) {
    return fail(err);
  }
}

function toCandle(c: { openTime: Date; open: unknown; high: unknown; low: unknown; close: unknown; volume: unknown }) {
  return { time: Math.floor(c.openTime.getTime() / 1000), open: d(c.open as never), high: d(c.high as never), low: d(c.low as never), close: d(c.close as never), volume: d(c.volume as never) };
}
