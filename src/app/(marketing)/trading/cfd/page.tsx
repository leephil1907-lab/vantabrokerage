import { LiveMarketTable } from '@/components/live-market-table';
import { CTASection, PageHero, Section, FeatureGrid } from '@/components/marketing-ui';

export const metadata = { title: 'CFD trading — indices and commodities' };
export const dynamic = 'force-dynamic';

export default function CfdPage() {
  return (
    <>
      <PageHero
        eyebrow="CFDs"
        title="Indices and commodities with transparent margin mechanics"
        body="NASDAQ 100, S&P 500, Dow Jones 30, DAX 40 and FTSE 100 plus gold, silver, WTI crude and natural gas — priced from live futures and index feeds."
      />
      <Section title="Live CFD markets">
        <LiveMarketTable category="CFD" />
      </Section>
      <Section title="CFD mechanics" body="A CFD settles the difference between entry and exit price on the notional exposure. Margin is reserved at entry, and liquidation price is derived from your leverage.">
        <FeatureGrid items={[
          { title: 'Margin model', body: 'Required margin = notional ÷ leverage. Maintenance rate is 0.5%; the risk engine liquidates below half the maintenance requirement.' },
          { title: 'Funding & fees', body: 'A taker fee is charged per side and posted to the ledger as a fee transaction, visible in your transaction history.' },
          { title: 'Directional trading', body: 'Go long or short with symmetric mechanics. P/L is computed from server-side marks, not chart pixels.' },
          { title: 'Position limits', body: 'Per-instrument leverage caps are configurable by the risk desk in the admin console.' },
          { title: 'Protective orders', body: 'Attach take-profit and stop-loss at entry, or amend them later; the engine closes the position when touched.' },
          { title: 'Exposure monitoring', body: 'Aggregate exposure and open positions are visible to the trading desk in the admin console.' },
        ]} />
      </Section>
      <CTASection title="Trade indices and commodities" body="All CFD markets are available in both your live and paper accounts." primary={{ href: '/register', label: 'Open account' }} secondary={{ href: '/trading-conditions', label: 'See conditions' }} />
    </>
  );
}
