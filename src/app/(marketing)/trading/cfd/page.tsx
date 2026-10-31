import Link from 'next/link';
import { PageHero, Section, StatBand, Split, FeatureGrid, Callout, CTASection, SpecTable } from '@/components/marketing-ui';
import { LiveMarketTable } from '@/components/live-market-table';
import { Accordion } from '@/components/accordion';

export const metadata = { title: 'CFD and index trading' };
export const dynamic = 'force-dynamic';

const FAQS = [
  { q: 'Which indices and commodities can I trade?', a: 'Cash indices (NAS100, SPX500, US30, GER40, UK100) and commodities (gold, silver, WTI crude, natural gas). The live table on this page is the authoritative, database-driven list — administrators can enable or disable instruments and every change is audit-logged.' },
  { q: 'How are index and commodity prices sourced?', a: 'Server-side from Yahoo Finance front-month/cash feeds, stored with provider and timestamp. Cash indices are not exchange-settled futures and their hours differ per instrument.' },
  { q: 'Do CFDs pay dividends or incur overnight charges?', a: 'The platform charges no fabricated financing: P/L is the price difference on the position. Funding charges only apply to perpetual crypto futures, where the rate is computed from the funding interval configured per instrument.' },
  { q: 'What are the leverage limits?', a: 'Limits are per instrument and enforced server-side — see the trading-conditions page for the exact caps currently loaded from the database.' },
];

export default function CfdPage() {
  return (
    <>
      <PageHero
        eyebrow="Indices & commodities"
        title="CFDs on the indices and commodities that move"
        body="Cash indices and commodity CFDs with continuous server-side margin monitoring. Position sizing, liquidation price and protective exits are computed by the risk engine against live marks — not estimated in the browser."
        breadcrumbs={[{ href: '/markets', label: 'Markets' }, { label: 'CFD' }]}
        symbol="NAS100"
        badge="9 instruments"
        aside={<StatBand items={[
          { k: '5', label: 'Cash indices', sub: 'US, EU and UK' },
          { k: '4', label: 'Commodities', sub: 'metals + energy' },
          { k: '100×', label: 'Max leverage', sub: 'per-instrument caps' },
          { k: 'live', label: 'Margin engine', sub: 'recomputed continuously' },
        ]} />}
      >
        <div className="flex flex-wrap gap-2">
          {['NAS100', 'SPX500', 'US30', 'GER40', 'UK100', 'XAUUSD', 'XAGUSD', 'WTIUSD', 'NATGAS'].map((t) => <span key={t} className="chip">{t}</span>)}
        </div>
      </PageHero>

      <Section
        eyebrow="Live quotes"
        title="Indices and commodities, priced from named feeds"
        body="Each row carries the provider and fetch time that produced it. Stale feeds are labelled."
        aside={<Link href="/dashboard/forex" className="btn-ghost px-4 py-2 text-[12.5px]">Open the desk →</Link>}
      >
        <LiveMarketTable category="CFD" limit={12} />
      </Section>

      <Section eyebrow="Mechanics" title="What the engine does with your position">
        <Split
          left={<FeatureGrid cols={2} items={[
            { title: 'Initial margin', body: 'Notional divided by your selected leverage, reserved from available balance the moment the order is accepted.' },
            { title: 'Maintenance & liquidation', body: 'If equity falls below maintenance the engine liquidates at a computed price and writes a liquidation record.' },
            { title: 'Protective exits', body: 'Take-profit and stop-loss are evaluated against the same mark price as liquidation, so there is one source of truth.' },
            { title: 'Session awareness', body: 'Instrument hours differ; the platform labels each instrument’s feed and status rather than assuming 24/7 trading.' },
          ]} />}
          right={
            <div className="space-y-3">
              <SpecTable
                columns={['Instrument class', 'Margin basis', 'Liquidation']}
                rows={[
                  ['FX majors', 'Notional ÷ leverage', 'Engine-computed price'],
                  ['Cash indices', 'Notional ÷ leverage', 'Engine-computed price'],
                  ['Metals & energy', 'Notional ÷ leverage', 'Engine-computed price'],
                ]}
                caption="Exact leverage caps per instrument are published on the trading-conditions page, read live from configuration."
              />
              <Callout tone="warn" title="Risk">
                Leveraged CFDs can lose more than your initial margin in fast markets. Stop orders are not guaranteed to execute at the requested level.
              </Callout>
            </div>
          }
        />
      </Section>

      <Section eyebrow="Questions" title="CFD FAQ" tight>
        <Accordion items={FAQS} />
      </Section>

      <CTASection title="Try CFDs on a funded paper account" body="Practise sizing, liquidation and protective exits with simulated funds before committing capital." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/trading-conditions', label: 'See leverage caps' }} />
    </>
  );
}
