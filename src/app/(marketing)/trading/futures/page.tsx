import { LiveMarketTable } from '@/components/live-market-table';
import { CTASection, PageHero, Section, FeatureGrid } from '@/components/marketing-ui';

export const metadata = { title: 'Crypto perpetual futures' };
export const dynamic = 'force-dynamic';

export default function FuturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Crypto futures"
        title="Perpetual contracts with a real risk engine"
        body="Long and short positions with cross or isolated margin, leverage up to 100× on majors, funding every eight hours, and liquidation priced from live marks — all calculated and validated on the backend."
      />
      <Section title="Live perpetuals">
        <LiveMarketTable category="FUTURES" />
      </Section>
      <Section title="Derivatives engine" body="Positions are never trusted from the client. The server computes margin, liquidation price, P/L and funding, and force-closes positions that breach maintenance requirements.">
        <FeatureGrid items={[
          { title: 'Margin modes', body: 'Cross margin uses the account balance as collateral; isolated margin caps loss to the position margin.' },
          { title: 'Liquidation price', body: 'Derived as entry × (1 ∓ (1/leverage − maintenance rate)) and shown live on every position.' },
          { title: 'Funding', body: 'Bounded funding rate derived from the 24-hour premium, applied by the worker and recorded per position.' },
          { title: 'Risk engine', body: 'Margin ratio monitored continuously; warnings at 80% of maintenance, liquidation below 50%.' },
          { title: 'Order types', body: 'Market, limit, stop and take-profit trigger orders with reduce-only support and reserved margin.' },
          { title: 'Full history', body: 'Executions, funding payments and liquidation events are separately auditable per account.' },
        ]} />
      </Section>
      <CTASection title="Open a futures position" body="Practice on the paper account with the exact same engine that runs live execution." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/trading-conditions', label: 'Review conditions' }} />
    </>
  );
}
