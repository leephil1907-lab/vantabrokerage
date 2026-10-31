import { LiveMarketTable } from '@/components/live-market-table';
import { CTASection, PageHero, Section } from '@/components/marketing-ui';

export const metadata = { title: 'Trading markets' };
export const dynamic = 'force-dynamic';

export default function MarketsPage() {
  return (
    <>
      <PageHero
        eyebrow="Markets"
        title="Forex, indices, commodities and crypto — priced from named providers"
        body="Every instrument below is live. Quotes are fetched server-side from Kraken, Coinbase or Yahoo Finance and stored with their provider and fetch timestamp so executions can be reconciled."
      />
      <Section title="Forex majors" body="Seven majors with institutional-style spreads, 2–200× leverage and market, limit and stop order support.">
        <LiveMarketTable category="FOREX" />
      </Section>
      <Section title="Indices & commodities" body="Cash indices and commodity CFDs with server-side margin monitoring and liquidation protection.">
        <LiveMarketTable category="CFD" />
      </Section>
      <Section title="Crypto spot" body="Ten USDT markets with order book, holdings accounting and locked-balance reservation.">
        <LiveMarketTable category="SPOT" />
      </Section>
      <Section title="Perpetual futures" body="Leveraged derivatives with funding, cross or isolated margin and liquidation pricing.">
        <LiveMarketTable category="FUTURES" />
      </Section>
      <CTASection title="Trade these markets with one wallet" body="Open an account to access every terminal, or explore with a funded paper account first." primary={{ href: '/register', label: 'Open account' }} secondary={{ href: '/trading-conditions', label: 'Trading conditions' }} />
    </>
  );
}
