import Link from 'next/link';
import { PageHero, Section, StatBand, Split, FeatureGrid, Callout, CTASection, SpecTable } from '@/components/marketing-ui';
import { LiveMarketTable } from '@/components/live-market-table';
import { Accordion } from '@/components/accordion';
import { Reveal } from '@/components/motion/primitives';

export const metadata = { title: 'Forex and CFD trading' };
export const dynamic = 'force-dynamic';

const FAQS = [
  { q: 'Are the prices on this page live?', a: 'Yes. Every row is fetched server-side from Yahoo Finance, stored with its provider and fetch timestamp, and refreshed continuously. If a quote is older than the platform tolerates it is labelled delayed rather than shown as live.' },
  { q: 'What order types are supported?', a: 'Market, limit and stop orders, with optional take-profit and stop-loss attachments. Market orders fill at the quoted side; limit and stop orders rest with margin reserved until the background worker triggers them.' },
  { q: 'How is leverage applied?', a: 'Margin is required balance divided by leverage, capped per instrument (for example 200× on FX majors, lower on indices and commodities). Margin ratio, liquidation price and protective exits are recomputed by the risk engine, not the browser.' },
  { q: 'What happens if I run out of margin?', a: 'The risk engine checks every open position against the live mark. If equity falls below maintenance, the position is liquidated at the price the engine computed and a liquidation record is written with the loss and timestamp.' },
  { q: 'Can I practise first?', a: 'Every registration provisions a funded paper account. It uses the same terminals, order path and risk engine with simulated balances, and is labelled PAPER everywhere it appears.' },
];

export default function ForexPage() {
  return (
    <>
      <PageHero
        eyebrow="Forex & CFDs"
        title="Trade the majors with server-side execution"
        body="EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD and NZD/USD, plus cash indices and commodity CFDs. Orders are priced from a server-fetched quote — never from the browser — and every fill records its provider, fee and quote timestamp."
        breadcrumbs={[{ href: '/markets', label: 'Markets' }, { label: 'Forex & CFDs' }]}
        symbol="EUR/USD"
        badge="16 instruments"
        aside={<StatBand items={[
          { k: '7', label: 'FX majors', sub: 'pips precision' },
          { k: '200×', label: 'Max FX leverage', sub: 'risk-engine enforced' },
          { k: '24/5', label: 'Session hours', sub: 'Sun 21:00 – Fri 21:00 UTC' },
          { k: '×3', label: 'Order types', sub: 'market · limit · stop' },
        ]} />}
      >
        <div className="flex flex-wrap gap-2">
          {['Market orders', 'Limit orders', 'Stop orders', 'Stop-loss', 'Take-profit', '2–200× leverage'].map((t) => <span key={t} className="chip">{t}</span>)}
        </div>
      </PageHero>

      <Section
        eyebrow="Live quotes"
        title="Majors, indices and commodities"
        body="Spreads are modelled per asset class and applied to the provider mid; bid and ask are shown separately so you can see the cost of crossing."
        aside={<Link href="/dashboard/forex" className="btn-ghost px-4 py-2 text-[12.5px]">Open the desk →</Link>}
      >
        <div className="space-y-6">
          <LiveMarketTable category="FOREX" limit={12} />
          <LiveMarketTable category="CFD" limit={12} />
        </div>
      </Section>

      <Section eyebrow="How it works" title="From quote to settlement">
        <Split
          left={
            <div className="space-y-3">
              <FeatureGrid cols={2} items={[
                { title: 'Server-priced fills', body: 'The order intent carries no price. The server fetches a fresh quote, applies the spread and fills against that value.' },
                { title: 'Reserved margin', body: 'Resting orders reserve margin immediately; cancelling releases it back to available balance in the same transaction.' },
                { title: 'Continuous risk', body: 'Mark price, margin ratio, liquidation price and protective exits are recomputed by a background worker.' },
                { title: 'Auditable records', body: 'Every fill stores venue, price, fee, quantity and the quote timestamp used.' },
                { title: 'Ledger settlement', body: 'Realised P/L posts through the double-entry ledger — there is no mutable "balance" field to corrupt.' },
                { title: 'Paper separation', body: 'Simulated and live balances live in separate accounts with separate ledgers and are never mixed.' },
              ]} />
            </div>
          }
          right={
            <div className="space-y-3">
              <SpecTable
                columns={['Order type', 'Trigger', 'Margin']}
                rows={[
                  ['Market', 'Immediate at quoted side', 'Charged at fill'],
                  ['Limit', 'When price trades through your level', 'Reserved on placement'],
                  ['Stop', 'When price crosses the trigger', 'Reserved on placement'],
                  ['Take-profit', 'Attached exit on the position', 'Inherits position'],
                  ['Stop-loss', 'Attached protective exit', 'Inherits position'],
                ]}
                caption="Margin reserved on placement is released on cancel, expiry or fill."
              />
              <Callout tone="info" title="No invented prices">
                If a provider is unreachable the platform serves the last known quote flagged <strong>stale</strong> and marks the chart
                feed as delayed. Nothing is ever interpolated or generated client-side.
              </Callout>
            </div>
          }
        />
      </Section>

      <Section eyebrow="Questions" title="Forex & CFD FAQ" tight>
        <Accordion items={FAQS} />
      </Section>

      <CTASection
        title="Open the forex terminal"
        body="Your paper account is funded automatically, so you can test the full order lifecycle — placement, partial fills, protective exits and settlement."
        primary={{ href: '/register', label: 'Create account' }}
        secondary={{ href: '/trading-conditions', label: 'Trading conditions' }}
      />
    </>
  );
}
