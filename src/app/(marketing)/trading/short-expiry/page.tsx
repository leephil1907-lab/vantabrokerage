import { CTASection, PageHero, Section, FeatureGrid } from '@/components/marketing-ui';

export const metadata = { title: 'Short-expiry CALL/PUT trading' };
export const dynamic = 'force-dynamic';

export default function ShortExpiryPage() {
  return (
    <>
      <PageHero
        eyebrow="Short-expiry"
        title="CALL/PUT contracts from 30 seconds to one hour"
        body="Pick an instrument, choose a direction and an expiry, and stake an amount. At expiry the contract settles against a fresh server-side quote. Entry and exit quote timestamps are stored on every trade so results are independently checkable."
      >
        <div className="rounded-xl border border-siren/25 bg-siren/[0.07] px-4 py-2.5 text-[11.5px] leading-relaxed text-siren">
          Short-expiry trading is extremely high risk. On deployments without a connected execution provider, contracts run in the
          <strong> paper environment</strong> and are labelled PAPER throughout the platform.
        </div>
      </PageHero>
      <Section title="How settlement works">
        <FeatureGrid items={[
          { title: 'Entry', body: 'Your stake is reserved from the available balance and locked the moment the contract opens.' },
          { title: 'Expiry', body: 'A fixed expiry from 30 seconds to one hour. The countdown in the terminal is driven by the server timestamp.' },
          { title: 'Settlement', body: 'At expiry the worker fetches a fresh quote and compares it with the stored entry price; the payout rate determines the credit.' },
          { title: 'Payout model', body: 'A win credits stake × (1 + payout rate); a loss debits the stake. A tie returns the stake with zero P/L.' },
          { title: 'Verification', body: 'Every contract stores the price feed, entry quote time and exit quote time in its settlement record.' },
          { title: 'Paper vs live', body: 'Paper contracts use simulated funds and are clearly flagged. Live contracts require an approved execution provider.' },
        ]} />
      </Section>
      <CTASection title="Try short-expiry in your paper account" body="Every new account includes simulated funds so you can test expiries, payouts and settlement end to end." primary={{ href: '/register', label: 'Open account' }} secondary={{ href: '/legal/risk-disclosure', label: 'Read risk disclosure' }} />
    </>
  );
}
