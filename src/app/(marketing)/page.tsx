import { listMarkets } from '@/lib/markets';
import { TickerTape } from '@/components/market-visual';
import { LiveHome } from '@/components/home/live-home';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const markets = await listMarkets({});
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
  }));

  return (
    <>
      <LiveHome markets={serialised} />
      <TickerTape markets={serialised.filter((m) => m.category !== 'BINARY')} />
    </>
  );
}
