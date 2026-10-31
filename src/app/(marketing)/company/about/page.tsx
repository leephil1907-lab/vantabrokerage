import { PageHero, Section, FeatureGrid, CTASection } from '@/components/marketing-ui';

export const metadata = { title: 'About Vanta Markets' };

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="Company" title="A brokerage platform built on ledger integrity" body="Vanta Markets is a multi-asset brokerage technology platform. Our design principle is simple: the server owns the truth. Prices, fills, balances, margin and settlement are computed and recorded on the backend, then rendered." />
      <Section title="What we build">
        <FeatureGrid items={[
          { title: 'Five trading environments', body: 'Forex and CFD, short-expiry CALL/PUT, crypto spot and perpetual futures — each with its own terminal and accounting rules.' },
          { title: 'Unified wallet', body: 'A single double-entry ledger covering deposits, trades, fees, funding, transfers and withdrawals.' },
          { title: 'Risk infrastructure', body: 'Margin monitoring, liquidation, funding, protective exits and exposure limits running in a background worker.' },
          { title: 'Operational tooling', body: 'A permissioned admin console for verification, funding review, market configuration, affiliates and support.' },
          { title: 'Auditability', body: 'Every administrative action records the actor, IP, timestamp and before/after state.' },
          { title: 'Honest integration state', body: 'Unconnected providers are reported in the UI instead of being faked with simulated success responses.' },
        ]} />
      </Section>
      <Section title="Operating principles">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Client money controls', 'Withdrawals require identity approval, re-authentication and finance authorisation. Administrators cannot silently adjust balances — any correction must be an audited ledger transaction.'],
            ['Paper vs live', 'Simulated trading is clearly labelled everywhere it appears. Live trading is only enabled when an execution provider is genuinely connected and authorised.'],
            ['Market data provenance', 'Every quote stores the provider that produced it and when. Stale prices are flagged rather than smoothed over.'],
            ['No fabricated activity', 'The platform never invents customers, deposits, trades or outcomes. Empty states say so plainly.'],
          ].map(([t, b]) => (
            <div key={t} className="panel p-5">
              <h3 className="text-[13.5px] font-semibold text-white">{t}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{b}</p>
            </div>
          ))}
        </div>
      </Section>
      <CTASection title="Explore the platform" body="Create an account to see the terminals, dashboard and back-office workflows in action." primary={{ href: '/register', label: 'Open account' }} secondary={{ href: '/contact', label: 'Contact us' }} />
    </>
  );
}
