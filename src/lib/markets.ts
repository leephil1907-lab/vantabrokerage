import { prisma } from './db';
import { fetchProviderQuote, getQuote } from './market-data';
import { d } from './ledger';
import type { TradingPair } from '@prisma/client';

const LIST_TTL_MS = 20_000;

export type MarketRow = {
  symbol: string;
  displayName: string;
  category: string;
  assetClass: string;
  baseAsset: string;
  quoteAsset: string;
  pricePrecision: number;
  maxLeverage: number;
  logo: string | null;
  last: number | null;
  bid: number | null;
  ask: number | null;
  change24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  source: string | null;
  fetchedAt: string | null;
  stale: boolean;
  enabled: boolean;
};

function row(pair: TradingPair, q?: { bid: unknown; ask: unknown; last: unknown; change24h: unknown; high24h: unknown; low24h: unknown; volume24h: unknown; source: string; fetchedAt: Date } | null, stale = false): MarketRow {
  return {
    symbol: pair.symbol,
    displayName: pair.displayName,
    category: pair.category,
    assetClass: pair.assetClass,
    baseAsset: pair.baseAsset,
    quoteAsset: pair.quoteAsset,
    pricePrecision: pair.pricePrecision,
    maxLeverage: pair.maxLeverage,
    logo: null,
    last: q ? d(q.last as never) : null,
    bid: q ? d(q.bid as never) : null,
    ask: q ? d(q.ask as never) : null,
    change24h: q?.change24h != null ? d(q.change24h as never) : null,
    high24h: q?.high24h != null ? d(q.high24h as never) : null,
    low24h: q?.low24h != null ? d(q.low24h as never) : null,
    volume24h: q?.volume24h != null ? d(q.volume24h as never) : null,
    source: q?.source ?? null,
    fetchedAt: q?.fetchedAt.toISOString() ?? null,
    stale,
    enabled: pair.enabled,
  };
}

/**
 * Returns market rows from the quote cache, refreshing entries older than `LIST_TTL_MS`.
 * Provider failures are surfaced via `stale: true` and a null source — never replaced with
 * invented prices.
 */
export async function listMarkets(opts: { category?: string; symbols?: string[]; refresh?: boolean } = {}) {
  const pairs = await prisma.tradingPair.findMany({
    where: { enabled: true, ...(opts.category ? { category: opts.category as never } : {}), ...(opts.symbols?.length ? { symbol: { in: opts.symbols } } : {}) },
    include: { },
    orderBy: [{ category: 'asc' }, { symbol: 'asc' }],
  });
  const quotes = await prisma.marketQuote.findMany({ where: { pairId: { in: pairs.map((p) => p.id) } } });
  const quoteMap = new Map(quotes.map((q) => [q.pairId, q]));
  const stale = pairs.filter((p) => {
    const q = quoteMap.get(p.id);
    return opts.refresh || !q || Date.now() - q.fetchedAt.getTime() > LIST_TTL_MS;
  });

  // Refresh stale quotes in parallel, capped so we never hammer providers.
  const refreshed = new Map<string, Awaited<ReturnType<typeof fetchProviderQuote>>>();
  const failures = new Set<string>();
  await Promise.all(
    stale.slice(0, 60).map(async (p) => {
      try {
        refreshed.set(p.id, await fetchProviderQuote(p));
      } catch {
        failures.add(p.id);
      }
    }),
  );
  if (refreshed.size) {
    await Promise.all(
      [...refreshed.entries()].map(([pairId, q]) =>
        prisma.marketQuote.upsert({
          where: { pairId },
          create: { pairId, bid: q.bid, ask: q.ask, last: q.last, open24h: q.open24h ?? null, high24h: q.high24h ?? null, low24h: q.low24h ?? null, volume24h: q.volume24h ?? null, change24h: q.change24h ?? null, spread: q.spread ?? null, source: q.provider },
          update: { bid: q.bid, ask: q.ask, last: q.last, open24h: q.open24h ?? null, high24h: q.high24h ?? null, low24h: q.low24h ?? null, volume24h: q.volume24h ?? null, change24h: q.change24h ?? null, spread: q.spread ?? null, source: q.provider, fetchedAt: new Date() },
        }).catch(() => undefined),
      ),
    );
    const fresh = await prisma.marketQuote.findMany({ where: { pairId: { in: [...refreshed.keys()] } } });
    fresh.forEach((q) => quoteMap.set(q.pairId, q));
  }

  return pairs.map((p) => {
    const q = quoteMap.get(p.id);
    return row(p, q ?? null, failures.has(p.id) || (!!q && Date.now() - q.fetchedAt.getTime() > 120_000));
  });
}

export async function getMarketRow(symbol: string) {
  const pair = await prisma.tradingPair.findUnique({ where: { symbol } });
  if (!pair) return null;
  const rows = await listMarkets({ symbols: [symbol], refresh: true });
  return rows[0] ?? row(pair, null, true);
}

export async function quoteFor(symbol: string) {
  const pair = await prisma.tradingPair.findUnique({ where: { symbol } });
  if (!pair) return null;
  const q = await getQuote(pair.id, 3000);
  return { ...q, pairId: pair.id, pricePrecision: pair.pricePrecision, displayName: pair.displayName };
}
