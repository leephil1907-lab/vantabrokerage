import Link from 'next/link';
import { PageHero, Section, StatBand, Split, FeatureGrid, Callout, CTASection, SpecTable } from '@/components/marketing-ui';
import { LiveMarketTable } from '@/components/live-market-table';
import { Accordion } from '@/components/accordion';

export const metadata = { title: 'Perpetual crypto futures' };
export const dynamic = 'force-dynamic';

const FAQS = [
  { q: 'Cross or isolated margin?', a: 'Both. Cross shares account equity across positions; isolated caps the loss for a position to its own margin. The mode is chosen per position and stored with it.' },
  { q: 'How is funding calculated?', a: 'The worker accrues funding on the interval configured per instrument (default 8 hours) using the mark price, and posts it as a ledger transaction. Every accrual is stored with its rate, mark and funding time.' },
  { q: 'How is liquidation price derived?', a: 'From the position entry, size, side, leverage and margin mode against the instrument maintenance requirement. It is recomputed continuously and shown live on the position row.' },
  { q: 'Are these real exchange futures?', a: 'Prices come from the connected provider (Kraken/Coinbase). Execution mode is displayed on every screen: in paper mode your orders fill against server-priced simulated balances, and the platform says so.' },
];

export default function FuturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Perpetual futures"
        title="Long or short crypto with cross or isolated margin"
        body="Perpetual contracts with funding accrual, liquidation pricing and a risk engine that recomputes exposure from live marks. Position, margin mode and leverage are stored per trade, so accounting is never ambiguous."
        breadcrumbs={[{ href: '/markets', label: 'Markets' }, { label: 'Perpetual futures' }]}
        symbol="BTC/USDT"
        badge="crypto perpetuals"
        aside={<StatBand items={[
          { k: '100×', label: 'Max leverage', sub: 'per instrument cap' },
          { k: '8h', label: 'Funding interval', sub: 'configurable per pair' },
          { k: '2', label: 'Margin modes', sub: 'cross · isolated' },
          { k: '24/7', label: 'Trading hours', sub: 'crypto markets' },
        ]} />}
      />
      <Section eyebrow="Live quotes" title="Perpetual markets" body="Mark price, funding and liquidation are derived from the same live quote that prices your fills." aside={<Link href="/dashboard/futures" className="btn-ghost px-4 py-2 text-[12.5px]">Open the desk →</Link>}>
        <LiveMarketTable category="FUTURES" limit={12} />
      </Section>
      <Section eyebrow="Risk model" title="Margin, funding and liquidation">
        <Split
          left={<FeatureGrid cols={2} items={[
            { title: 'Mark-price P/L', body: 'Unrealised P/L is computed from the mark, not the last trade, so thin prints cannot distort equity.' },
            { title: 'Funding accrual', body: 'Charged on the configured interval and written to the ledger with rate, mark and timestamp.' },
            { title: 'Forced liquidation', body: 'When equity falls below maintenance the engine closes the position and records the loss.' },
            { title: 'Position storage', body: 'Leverage, margin mode, entry, size, TP and SL are persisted and surfaced in every table.' },
          ]} />}
          right={
            <div className="space-y-3">
              <SpecTable
                columns={['Parameter', 'Source', 'Visibility']}
                rows={[
                  ['Max leverage', 'Instrument configuration', 'Trading conditions page'],
                  ['Funding interval', 'Instrument configuration', 'Position + history rows'],
                  ['Liquidation price', 'Risk engine', 'Live on every position'],
                  ['Maintenance margin', 'Instrument class rules', 'Risk disclosure'],
                ]}
                caption="Configuration is read from the database and changes are recorded in the admin audit log."
              />
              <Callout tone="warn" title="Leverage risk">
                Futures positions can be liquidated quickly. With 100× leverage a 1% adverse move consumes the entire margin.
              </Callout>
            </div>
          }
        />
      </Section>
      <Section eyebrow="Questions" title="Futures FAQ" tight><Accordion items={FAQS} /></Section>
      <CTASection title="Open the futures desk" body="Size a short with isolated margin on your paper account and watch the liquidation price move in real time." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/legal/risk-disclosure', label: 'Risk disclosure' }} />
    </>
  );
}
