import { listMarketsFast } from '@/lib/markets';
import { getSessionUser } from '@/lib/auth';
import { TickerTape } from '@/components/market-visual';
import { LiveHome } from '@/components/home/live-home';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Cached quotes only: the hero must paint instantly, and the client poll
  // refreshes the tape every 15s (stale rows are labelled).
  const markets = await listMarketsFast({}).catch(() => {
    // The public homepage and its separate crypto references should still render
    // if the configured market catalogue is temporarily unreachable.
    console.error('[home] Market catalogue unavailable.');
    return [];
  });
  const user = await getSessionUser().catch(() => null);
  const serialised = markets.map((m) => ({
    symbol: m.symbol,
    last: m.last,
    bid: m.bid,
    ask: m.ask,
    change24h: m.change24h,
    high24h: m.high24h,
    low24h: m.low24h,
    source: m.source,
    stale: m.stale,
    category: m.category,
    pricePrecision: m.pricePrecision,
  }));

  return (
    <>
      <LiveHome markets={serialised} authenticated={!!user} />
      <TickerTape markets={serialised.filter((m) => m.category !== 'BINARY')} />
    </>
  );
}
