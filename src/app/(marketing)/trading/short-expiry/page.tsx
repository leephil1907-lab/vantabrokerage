import Link from 'next/link';
import { PageHero, Section, StatBand, Split, FeatureGrid, Callout, CTASection, SpecTable } from '@/components/marketing-ui';
import { LiveMarketTable } from '@/components/live-market-table';
import { Accordion } from '@/components/accordion';

export const metadata = { title: 'Short-expiry CALL/PUT contracts' };
export const dynamic = 'force-dynamic';

const FAQS = [
  { q: 'How is a contract settled?', a: 'At expiry the worker fetches a fresh server-side quote and compares it with the stored entry price. A win credits stake × (1 + payout rate); a loss debits the stake; an exact tie returns the stake with zero P/L.' },
  { q: 'Can I verify the result?', a: 'Yes. Every contract stores the entry quote, exit quote, both timestamps and the provider used. Nothing about the outcome depends on client-side data.' },
  { q: 'What expiries are available?', a: 'From 30 seconds to one hour, in fixed steps (30s, 1m, 2m, 5m, 10m, 15m, 30m, 1h). The countdown in the terminal is driven by the server timestamp, not your device clock.' },
  { q: 'Where do the payout percentages come from?', a: 'From the instrument payout rate stored in platform configuration (audit-logged when changed) and shown before you submit. The platform does not advertise a headline percentage it cannot honour.' },
  { q: 'Is this suitable for me?', a: 'Short-expiry binary-style contracts are very high risk and unsuitable for most retail investors: a losing contract forfeits the entire stake within minutes. Read the risk disclosure first.' },
];

export default function ShortExpiryPage() {
  return (
    <>
      <PageHero
        eyebrow="Short-expiry"
        title="CALL / PUT contracts from 30 seconds to one hour"
        body="Choose an instrument, a direction and an expiry, then stake an amount. At expiry the contract settles against a freshly fetched server quote — and both quotes are stored, so every result is independently checkable."
        breadcrumbs={[{ href: '/markets', label: 'Markets' }, { label: 'Short-expiry' }]}
        symbol="EUR/USD"
        badge="8 expiries"
        aside={<StatBand items={[
          { k: '30s', label: 'Shortest expiry', sub: 'to 1 hour' },
          { k: '8', label: 'Expiry steps', sub: 'fixed intervals' },
          { k: '2×', label: 'Quotes stored', sub: 'entry + settlement' },
          { k: 'paper', label: 'Environment', sub: 'live execution unavailable' },
        ]} />}
      >
        <Callout tone="warn" title="High risk">
          A losing short-expiry contract forfeits the entire stake within minutes. Contracts run only in the <strong>paper environment</strong> and are labelled PAPER throughout the platform.
        </Callout>
      </PageHero>

      <Section eyebrow="Live quotes" title="Underlying instruments" body="The same live feeds that settle your contract price these markets." aside={<Link href="/dashboard/short-expiry" className="btn-ghost px-4 py-2 text-[12.5px]">Open the desk →</Link>}>
        <LiveMarketTable category="BINARY" limit={12} />
      </Section>

      <Section eyebrow="Lifecycle" title="Entry, expiry, settlement">
        <Split
          left={<FeatureGrid cols={2} items={[
            { title: 'Entry', body: 'Your stake is reserved from available balance and locked the instant the contract opens.' },
            { title: 'Expiry', body: 'A fixed window from 30 seconds to one hour; the terminal countdown follows the server timestamp.' },
            { title: 'Settlement', body: 'The worker compares a fresh quote with the stored entry price and applies the contract payout rate.' },
            { title: 'Payout model', body: 'Win: stake × (1 + payout). Loss: stake forfeited. Tie: stake returned, zero P/L.' },
            { title: 'Verification', body: 'Provider, entry quote time and exit quote time are stored on every contract.' },
            { title: 'Environment flag', body: 'Paper contracts use simulated funds and are marked PAPER in every list and receipt.' },
          ]} />}
          right={
            <div className="space-y-3">
              <SpecTable
                columns={['Outcome', 'Settlement', 'Ledger']}
                rows={[
                  ['Win', 'Stake + payout credited', 'Balanced entry'],
                  ['Loss', 'Stake debited', 'Balanced entry'],
                  ['Tie', 'Stake returned', 'Balanced entry'],
                ]}
                caption="Every settlement posts a balanced double-entry transaction — no manual balance edits are possible."
              />
              <Callout tone="info" title="Provable outcomes">
                Store the entry and exit quote timestamps means a result can be reproduced later from the same provider data.
              </Callout>
            </div>
          }
        />
      </Section>

      <Section eyebrow="Questions" title="Short-expiry FAQ" tight><Accordion items={FAQS} /></Section>

      <CTASection title="Test expiries on your paper account" body="Every new account includes simulated funds so you can run contracts to expiry and audit the settlement yourself." primary={{ href: '/register', label: 'Open account' }} secondary={{ href: '/legal/risk-disclosure', label: 'Read risk disclosure' }} />
    </>
  );
}
