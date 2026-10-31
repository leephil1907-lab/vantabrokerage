import { z } from 'zod';
import { prisma } from './db';
import { AppError } from './errors';

/** Supported intervals and provider mapping */
export const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;
export type Interval = (typeof INTERVALS)[number];

export const INTERVAL_SECONDS: Record<Interval, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
};

type Provider = 'kraken' | 'coinbase' | 'yahoo';

const round = (v: number, dp = 8) => Math.round(v * 10 ** dp) / 10 ** dp;

const YAHOO_INTERVAL: Record<Interval, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '1h', '1d': '1d' };
const COINBASE_GRAN: Record<Interval, number> = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1d': 86400 };

export type Quote = {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  open24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  change24h?: number;
  spread?: number;
  source: string;
  fetchedAt: string;
};

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

function withTimeout(ms: number) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return { signal: ac.signal, done: () => clearTimeout(t) };
}

async function getJson(url: string, headers: Record<string, string> = {}) {
  const { signal, done } = withTimeout(8000);
  try {
    const res = await fetch(url, {
      signal,
      cache: 'no-store',
      headers: { 'User-Agent': 'VantaMarkets/1.0 (market-data service)', Accept: 'application/json', ...headers },
    });
    if (!res.ok) throw new AppError('DATA_PROVIDER_ERROR', `Market data provider responded ${res.status}`, 502);
    return (await res.json()) as any;
  } finally {
    done();
  }
}

function spreadFor(assetClass: string, price: number) {
  // documented synthetic spread model applied to mid price, per asset class
  const bps = assetClass === 'CRYPTO' ? 1.5 : assetClass === 'FOREX' ? 0.9 : 2.0;
  return (price * bps) / 10000;
}

/** Live crypto quote from Kraken public ticker (no key required). */
async function krakenQuote(sourceSymbol: string): Promise<Omit<Quote, 'symbol'>> {
  const data = await getJson(`https://api.kraken.com/0/public/Ticker?pair=${encodeURIComponent(sourceSymbol)}`);
  if (data.error?.length) throw new AppError('DATA_PROVIDER_ERROR', String(data.error[0]), 502);
  const result = data.result as Record<string, any>;
  const key = Object.keys(result)[0];
  const t = result[key];
  const last = Number(t.c[0]);
  const open = Number(t.o);
  return {
    bid: Number(t.b[0]),
    ask: Number(t.a[0]),
    last,
    open24h: open,
    high24h: Number(t.h[1]),
    low24h: Number(t.l[1]),
    volume24h: Number(t.v[1]),
    change24h: open ? ((last - open) / open) * 100 : 0,
    source: 'kraken',
    fetchedAt: new Date().toISOString(),
  };
}

async function coinbaseQuote(sourceSymbol: string): Promise<Omit<Quote, 'symbol'>> {
  const data = await getJson(`https://api.coinbase.com/v2/prices/${sourceSymbol}/spot`);
  const last = Number(data.data.amount);
  return { bid: last, ask: last, last, source: 'coinbase', fetchedAt: new Date().toISOString() };
}

async function yahooQuote(sourceSymbol: string, assetClass: string): Promise<Omit<Quote, 'symbol'>> {
  const data = await getJson(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sourceSymbol)}?interval=1m&range=1d`,
  );
  const meta = data.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new AppError('DATA_PROVIDER_ERROR', 'Provider returned no price', 502);
  const last = Number(meta.regularMarketPrice);
  const prev = Number(meta.chartPreviousClose ?? meta.previousClose ?? last);
  const half = spreadFor(assetClass, last) / 2;
  return {
    bid: last - half,
    ask: last + half,
    last,
    open24h: prev,
    high24h: meta.regularMarketDayHigh ? Number(meta.regularMarketDayHigh) : undefined,
    low24h: meta.regularMarketDayLow ? Number(meta.regularMarketDayLow) : undefined,
    change24h: prev ? ((last - prev) / prev) * 100 : 0,
    source: 'yahoo',
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchProviderQuote(pair: { symbol: string; assetClass: string; dataSource: string; sourceSymbol: string | null }): Promise<Quote & { provider: string }> {
  const provider = (pair.dataSource || 'yahoo') as Provider;
  const sym = pair.sourceSymbol || pair.symbol;
  let q: Omit<Quote, 'symbol'> & { provider: string };
  if (provider === 'kraken') {
    try {
      q = { ...(await krakenQuote(sym)), provider: 'kraken' };
    } catch {
      q = { ...(await coinbaseQuote(pair.symbol.replace('/', '-'))), provider: 'coinbase' };
    }
  } else if (provider === 'coinbase') {
    q = { ...(await coinbaseQuote(sym)), provider: 'coinbase' };
  } else {
    q = { ...(await yahooQuote(sym, pair.assetClass)), provider: 'yahoo' };
  }
  if (!isFinite(q.last) || q.last <= 0) throw new AppError('DATA_PROVIDER_ERROR', 'Invalid price received', 502);
  if (!isFinite(q.bid) || q.bid <= 0) q.bid = q.last;
  if (!isFinite(q.ask) || q.ask <= 0) q.ask = q.last;
  if (q.bid > q.ask) [q.bid, q.ask] = [q.ask, q.bid];
  // Some providers report a last trade outside the current top of book; keep the book coherent.
  if (q.last < q.bid) q.last = q.bid;
  if (q.last > q.ask) q.last = q.ask;
  if (q.bid === q.ask) {
    const half = spreadFor(pair.assetClass, q.last) / 2;
    q.bid = round(q.last - half, 8);
    q.ask = round(q.last + half, 8);
  }
  return { ...q, symbol: pair.symbol, spread: q.ask - q.bid };
}

/** Get a quote, using the DB cache for at most `maxAgeMs`. */
export async function getQuote(pairId: string, maxAgeMs = 4000): Promise<Quote> {
  const pair = await prisma.tradingPair.findUnique({ where: { id: pairId } });
  if (!pair) throw new AppError('NOT_FOUND', 'Trading pair not found', 404);
  const cached = await prisma.marketQuote.findUnique({ where: { pairId } });
  if (cached && Date.now() - cached.fetchedAt.getTime() < maxAgeMs) {
    return {
      symbol: pair.symbol,
      bid: Number(cached.bid),
      ask: Number(cached.ask),
      last: Number(cached.last),
      open24h: cached.open24h ? Number(cached.open24h) : undefined,
      high24h: cached.high24h ? Number(cached.high24h) : undefined,
      low24h: cached.low24h ? Number(cached.low24h) : undefined,
      volume24h: cached.volume24h ? Number(cached.volume24h) : undefined,
      change24h: cached.change24h ? Number(cached.change24h) : undefined,
      spread: cached.spread ? Number(cached.spread) : undefined,
      source: cached.source,
      fetchedAt: cached.fetchedAt.toISOString(),
    };
  }
  const fresh = await fetchProviderQuote(pair);
  await prisma.marketQuote.upsert({
    where: { pairId },
    create: {
      pairId,
      bid: fresh.bid,
      ask: fresh.ask,
      last: fresh.last,
      open24h: fresh.open24h ?? null,
      high24h: fresh.high24h ?? null,
      low24h: fresh.low24h ?? null,
      volume24h: fresh.volume24h ?? null,
      change24h: fresh.change24h ?? null,
      spread: fresh.spread ?? null,
      source: fresh.provider,
    },
    update: {
      bid: fresh.bid,
      ask: fresh.ask,
      last: fresh.last,
      open24h: fresh.open24h ?? null,
      high24h: fresh.high24h ?? null,
      low24h: fresh.low24h ?? null,
      volume24h: fresh.volume24h ?? null,
      change24h: fresh.change24h ?? null,
      spread: fresh.spread ?? null,
      source: fresh.provider,
      fetchedAt: new Date(),
    },
  });
  const { provider: _p, ...rest } = fresh;
  return rest;
}

/** Fetch historical candles from the provider, aggregate to the requested interval. */
export async function fetchProviderCandles(
  pair: { symbol: string; assetClass: string; dataSource: string; sourceSymbol: string | null },
  interval: Interval,
  limit = 300,
): Promise<Candle[]> {
  const provider = (pair.dataSource || 'yahoo') as Provider;
  const secs = INTERVAL_SECONDS[interval];
  const spanSecs = secs * limit;

  if (provider === 'kraken' || provider === 'coinbase') {
    const sym = pair.sourceSymbol || pair.symbol;
    if (provider === 'kraken') {
      try {
        const gran = Math.min(secs, 900);
        const since = Math.floor(Date.now() / 1000) - gran * (limit + 5) * (secs / gran);
        const data = await getJson(
          `https://api.kraken.com/0/public/OHLC?pair=${encodeURIComponent(sym)}&interval=${Math.max(1, Math.round(gran / 60))}&since=${since}`,
        );
        if (data.error?.length) throw new Error(String(data.error[0]));
        const key = Object.keys(data.result).find((k) => k !== 'last')!;
        const rows = data.result[key] as any[];
        const base = rows.map((r) => ({
          time: Number(r[0]),
          open: Number(r[1]),
          high: Number(r[2]),
          low: Number(r[3]),
          close: Number(r[4]),
          volume: Number(r[6]),
        }));
        return aggregate(base, secs).slice(-limit);
      } catch {
        /* fall through to coinbase */
      }
    }
    const cbSym = pair.symbol.replace('/', '-');
    const gran = Math.min(secs, 300);
    const start = new Date(Date.now() - gran * (limit + 5) * (secs / gran) * 1000).toISOString();
    const data = await getJson(`https://api.exchange.coinbase.com/products/${cbSym}/candles?granularity=${gran}&start=${start}`);
    const base = (data as any[])
      .map((r) => ({ time: Number(r[0]), low: Number(r[1]), high: Number(r[2]), open: Number(r[3]), close: Number(r[4]), volume: Number(r[5]) }))
      .sort((a, b) => a.time - b.time);
    return aggregate(base, secs).slice(-limit);
  }

  // Yahoo
  const yInterval = YAHOO_INTERVAL[interval];
  const range = spanSecs > 86400 * 30 ? '3mo' : spanSecs > 86400 * 5 ? '1mo' : spanSecs > 86400 ? '5d' : '1d';
  const data = await getJson(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(pair.sourceSymbol || pair.symbol)}?interval=${yInterval}&range=${range}`,
  );
  const r = data.chart?.result?.[0];
  if (!r?.timestamp) throw new AppError('DATA_PROVIDER_ERROR', 'No candle data available', 502);
  const q = r.indicators.quote[0];
  const base: Candle[] = [];
  for (let i = 0; i < r.timestamp.length; i++) {
    if (q.open?.[i] == null || q.close?.[i] == null) continue;
    base.push({ time: Number(r.timestamp[i]), open: Number(q.open[i]), high: Number(q.high[i]), low: Number(q.low[i]), close: Number(q.close[i]), volume: Number(q.volume?.[i] ?? 0) });
  }
  return aggregate(base, secs).slice(-limit);
}

/** Aggregate base candles up into target interval seconds (bucketed by epoch). */
export function aggregate(base: Candle[], bucketSecs: number): Candle[] {
  const map = new Map<number, Candle>();
  for (const c of base) {
    const b = Math.floor(c.time / bucketSecs) * bucketSecs;
    const cur = map.get(b);
    if (!cur) map.set(b, { ...c, time: b });
    else {
      cur.high = Math.max(cur.high, c.high);
      cur.low = Math.min(cur.low, c.low);
      cur.close = c.close;
      cur.volume += c.volume;
    }
  }
  return [...map.values()].sort((a, b) => a.time - b.time);
}

export const intervalSchema = z.enum(INTERVALS);
