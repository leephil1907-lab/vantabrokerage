import Link from 'next/link';
import { PageHero, Section, StatBand, FeatureGrid, Callout, CTASection, SpecTable } from '@/components/marketing-ui';
import { Accordion } from '@/components/accordion';

export const metadata = { title: 'Account types' };

const FAQS = [
  { q: 'Do I need to deposit to open an account?', a: 'No. Registration provisions a live account and a funded paper account immediately. You need no payment details to explore every terminal.' },
  { q: 'What is the difference between paper and live?', a: 'Paper accounts use simulated balances and are labelled PAPER everywhere. Live accounts hold real balances but require a connected execution provider before orders can be routed — until then the platform reports live execution as not connected rather than pretending.' },
  { q: 'Can I move funds between accounts?', a: 'Transfers between your own accounts are supported and post through the double-entry ledger like any other movement, so the audit trail stays complete.' },
  { q: 'What do I need before withdrawing?', a: 'Approved identity verification, re-authentication with your password (plus two-factor if enabled), and sufficient available balance. Requests then queue for finance review.' },
];

const TIERS = [
  {
    name: 'Paper',
    price: 'Included',
    tagline: 'Practise the whole platform',
    features: ['Simulated balance funded on registration', 'All five terminals and every order type', 'Same risk engine, ledger and settlement path', 'Clearly labelled PAPER execution'],
    href: '/register',
    cta: 'Start now',
    highlight: false,
  },
  {
    name: 'Standard',
    price: 'From $100',
    tagline: 'Full live market access',
    features: ['Market, limit and stop orders', 'FX leverage up to 200×, per-instrument caps', 'Crypto spot, futures and short-expiry access', 'Deposits and withdrawals with KYC'],
    href: '/register',
    cta: 'Choose Standard',
    highlight: true,
  },
  {
    name: 'Pro',
    price: 'From $5,000',
    tagline: 'For higher-frequency traders',
    features: ['Priority execution review', 'Higher withdrawal limits', 'Extended futures leverage windows', 'Dedicated account support'],
    href: '/contact',
    cta: 'Request review',
    highlight: false,
  },
];

export default function AccountsPage() {
  return (
    <>
      <PageHero
        eyebrow="Accounts"
        title="Start on paper, move to live when you are ready"
        body="One login, separate accounts, separate ledgers. No mixing of simulated and real balances, and no surprises about which environment an order executed in — the environment is printed on every screen and every record."
        breadcrumbs={[{ label: 'Accounts' }]}
        aside={<StatBand items={[
          { k: '2', label: 'Account types', sub: 'paper + live' },
          { k: '5', label: 'Desks per account', sub: 'shared wallet' },
          { k: '1', label: 'Double-entry ledger', sub: 'per account' },
          { k: '0', label: 'Balances edited by hand', sub: 'ledger only' },
        ]} />}
      />
      <Section eyebrow="Compare" title="Account tiers">
        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.name} className={`relative flex flex-col rounded-2xl border bg-ink-850/70 p-5 ${t.highlight ? 'border-lime/35 ring-1 ring-lime/20' : 'border-white/[0.07]'}`}>
              {t.highlight && <span className="absolute -top-2.5 left-5 rounded-full bg-lime px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-ink-950">Most used</span>}
              <div className="flex items-baseline justify-between">
                <h3 className="text-[15px] font-semibold text-white">{t.name}</h3>
                <span className="chip">{t.price}</span>
              </div>
              <p className="mt-1 text-[12px] text-muted">{t.tagline}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[12px] leading-relaxed text-white/80">
                    <svg width="13" height="13" viewBox="0 0 12 12" className="mt-0.5 shrink-0" fill="none"><path d="M2.5 6.4 4.7 8.6l4.8-5" stroke="#c8f751" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={t.href} className={`mt-5 ${t.highlight ? 'btn-primary' : 'btn-ghost'} py-2 text-[12.5px]`}>{t.cta}</Link>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Detail" title="What every account includes">
        <div className="space-y-4">
          <SpecTable
            columns={['Capability', 'Paper', 'Standard', 'Pro']}
            rows={[
              ['Forex, indices, commodities', 'Yes', 'Yes', 'Yes'],
              ['Crypto spot + perpetual futures', 'Yes', 'Yes', 'Yes'],
              ['Short-expiry CALL/PUT', 'Yes (paper)', 'Yes', 'Yes'],
              ['Max FX leverage', '200×', '200×', '200×'],
              ['Extended futures windows', '—', '—', 'Yes'],
              ['Withdrawal review', 'n/a', 'Standard', 'Priority'],
              ['Recorded environment flag', 'PAPER', 'LIVE', 'LIVE'],
            ]}
            caption="Leverage caps are per-instrument and enforced server-side; the trading-conditions page lists the live values."
          />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Callout tone="info" title="Environment is never ambiguous">
              An order receipt, position row and history entry all carry the account that produced them. There is no path in the UI or API
              where a paper fill is presented as live.
            </Callout>
            <Callout tone="ok" title="No fake funding">
              Deposits are credited only when a provider confirms them or finance approves them. The platform will not show a completed
              payment that has not happened.
            </Callout>
          </div>
        </div>
      </Section>

      <Section eyebrow="Questions" title="Account FAQ" tight><Accordion items={FAQS} /></Section>

      <CTASection title="Open an account in under a minute" body="Register to get a live account, a funded paper account and access to every terminal. No payment details required to start." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/login', label: 'Sign in' }} />
    </>
  );
}
