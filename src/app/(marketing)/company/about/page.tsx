import { PageHero, Section, StatBand, FeatureGrid, Split, Callout, CTASection, SpecTable } from '@/components/marketing-ui';
import { Accordion } from '@/components/accordion';

export const metadata = { title: 'About PRIMEVEST' };

const FAQS = [
  { q: 'Is PRIMEVEST a broker or a platform?', a: 'PRIMEVEST is a trading-platform demonstration with paper execution. Live order routing is not implemented and live accounts cannot place orders.' },
  { q: 'Where does your market data come from?', a: 'Named public providers: Kraken, Coinbase and Yahoo Finance for configured instruments. Each quote stores its provider and fetch timestamp.' },
  { q: 'How is the platform built?', a: 'Next.js (App Router) with React server components, Prisma over PostgreSQL, a background worker for settlements, marks, funding and liquidation checks, and a strictly typed API layer shared by the web client.' },
  { q: 'How do you prove integrity?', a: 'Every balance movement is a balanced double-entry transaction. The test suite reconciles wallets against ledger entries, checks that no transaction is unbalanced and asserts that no balance is negative.' },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Company"
        title="A brokerage platform built on ledger integrity"
        body="Our design principle is simple: the server owns the truth. Prices, fills, balances, margin and settlement are computed and recorded on the backend, then rendered — never the other way round."
        breadcrumbs={[{ label: 'About' }]}
        aside={<StatBand items={[
          { k: '5', label: 'Execution desks', sub: 'FX · CFD · spot · perps · binaries' },
          { k: '44', label: 'Instruments', sub: 'database-driven' },
          { k: 'paper', label: 'Execution', sub: 'simulated funds' },
          { k: '2×', label: 'Ledger entries', sub: 'per movement' },
        ]} />}
      />
      <Section eyebrow="What we build" title="Five desks, one account">
        <FeatureGrid items={[
          { title: 'Forex & CFDs', body: 'Seven majors, cash indices and commodities with reserved-margin order handling and a continuous risk engine.', symbol: 'EUR/USD' },
          { title: 'Crypto spot', body: 'Crypto paper markets with holdings accounting and a reserve-then-settle flow. Automated deposit verification is not connected.', symbol: 'BTC/USDT' },
          { title: 'Perpetual futures', body: 'Cross or isolated margin, funding accrual, mark-price P/L and forced liquidation.', symbol: 'ETH/USDT' },
          { title: 'Short-expiry', body: 'CALL/PUT contracts settled against stored server quotes, with entry and exit timestamps on every trade.', symbol: 'SOL/USDT' },
          { title: 'Unified wallet', body: 'One double-entry ledger covering deposits, trades, fees, funding, transfers and withdrawals.' },
          { title: 'Back office', body: 'RBAC across five staff roles, with every privileged action written to an audit log carrying actor, IP and before/after state.' },
        ]} />
      </Section>
      <Section eyebrow="Principles" title="How we make decisions">
        <Split
          left={
            <div className="space-y-3">
              {[
                ['Truth over polish', 'If a provider is down, the platform shows a delayed or unavailable state. It never fills the gap with invented data.'],
                ['Explicit environments', 'Paper and live balances are separate accounts with separate ledgers, labelled on every screen and record.'],
                ['Auditability by default', 'Client orders, finance decisions and admin changes all leave a trail with actor and timestamp.'],
                ['Security in depth', 'Hashed passwords, hashed session tokens with device history, TOTP two-factor, rate limiting and strict input validation.'],
              ].map(([t, b]) => (
                <div key={t} className="rounded-xl border border-white/[0.07] bg-ink-850/70 p-4">
                  <p className="text-[13px] font-semibold text-white">{t}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">{b}</p>
                </div>
              ))}
            </div>
          }
          right={
            <div className="space-y-3">
              <SpecTable
                columns={['Layer', 'Technology']}
                rows={[
                  ['Web', 'Next.js App Router · React 19 · Tailwind'],
                  ['Data', 'PostgreSQL · Prisma ORM'],
                  ['Charts', 'TradingView Lightweight Charts'],
                  ['Motion', 'Framer Motion + WebGL (code-split)'],
                  ['Jobs', 'Background worker (marks, funding, settlement)'],
                  ['Tests', 'End-to-end integration suite'],
                ]}
                caption="No third-party analytics or advertising scripts are loaded."
              />
              <Callout tone="info" title="Open about limits">
                Live execution and automated deposit verification are not implemented. This demonstration is not ready for real funds.
              </Callout>
            </div>
          }
        />
      </Section>
      <Section eyebrow="Questions" title="About the platform" tight><Accordion items={FAQS} /></Section>
      <CTASection title="Explore the platform" body="Open an account and walk the same workflows our test suite exercises end to end." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/help', label: 'Help centre' }} />
    </>
  );
}
