import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireStaff();
    const pairs = await prisma.tradingPair.findMany({ orderBy: [{ category: 'asc' }, { symbol: 'asc' }], include: { candles: { take: 0 } } });
    const quotes = await prisma.marketQuote.findMany();
    const qmap = new Map(quotes.map((q) => [q.pairId, q]));
    return json({
      markets: pairs.map((p) => ({
        id: p.id, symbol: p.symbol, displayName: p.displayName, category: p.category, assetClass: p.assetClass, enabled: p.enabled,
        maxLeverage: p.maxLeverage, takerFee: Number(p.takerFee), payoutRate: p.payoutRate ? Number(p.payoutRate) : null,
        dataSource: p.dataSource, sourceSymbol: p.sourceSymbol,
        last: qmap.get(p.id) ? Number(qmap.get(p.id)!.last) : null,
        quoteSource: qmap.get(p.id)?.source ?? null,
        quoteAgeSeconds: qmap.get(p.id) ? Math.round((Date.now() - qmap.get(p.id)!.fetchedAt.getTime()) / 1000) : null,
      })),
      providers: {
        yahoo: 'connected',
        kraken: 'connected',
        coinbase: 'connected',
        mode: process.env.MARKET_DATA_MODE ?? 'live',
      },
    });
  } catch (err) {
    return fail(err);
  }
}
