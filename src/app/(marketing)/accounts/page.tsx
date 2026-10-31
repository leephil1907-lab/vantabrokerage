import { CTASection, PageHero, Section, FeatureGrid } from '@/components/marketing-ui';

export const metadata = { title: 'Account types' };

const TIERS = [
  { name: 'Paper', price: 'Included', features: ['Simulated balance funded on registration', 'All five terminals and order types', 'Clearly labelled PAPER execution', 'Full risk engine and ledger behaviour'], tone: 'ring-1 ring-sky-400/20' },
  { name: 'Standard', price: 'From $100', features: ['Live account with market/limit/stop orders', 'Forex leverage up to 200×', 'Crypto spot, futures and short-expiry access', 'Deposits and withdrawals with KYC'], tone: 'ring-1 ring-lime/30' },
  { name: 'Pro', price: 'From $5,000', features: ['Priority execution review', 'Higher withdrawal limits', 'Extended futures leverage windows', 'Dedicated account support'], tone: '' },
];

export default function AccountsPage() {
  return (
    <>
      <PageHero eyebrow="Account types" title="Two account classes, one clean separation" body="Every client gets a live account and a paper account. They share the same navigation and terminals but have independent balances, ledgers and history — paper results are never presented as real money." />
      <Section title="Tiers">
        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.name} className={`panel p-5 ${t.tone}`}>
              <div className="flex items-center justify-between"><h3 className="text-[14px] font-semibold text-white">{t.name}</h3><span className="chip">{t.price}</span></div>
              <ul className="mt-3 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[12px] text-white/80">
                    <svg width="14" height="14" viewBox="0 0 15 15" className="mt-0.5 shrink-0" fill="none"><path d="M3 8l3 3 6-7" stroke="#c8f751" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
      <Section title="What every account includes">
        <FeatureGrid items={[
          { title: 'Unified wallet', body: 'One ledger across every terminal, with internal transfers between your live and paper accounts.' },
          { title: 'Order management', body: 'Market, limit and stop orders with reserved margin and cancellation that releases funds.' },
          { title: 'Risk controls', body: 'Leverage caps, margin ratio monitoring, liquidation price and protective exits.' },
          { title: 'Reporting', body: 'Trade history, executions, funding, liquidations and a full transaction ledger.' },
          { title: 'Security', body: 'Hashed passwords, revocable sessions, optional TOTP two-factor and withdrawal re-authentication.' },
          { title: 'Support', body: 'Ticket system with categories, priorities and staff replies in your dashboard.' },
        ]} />
      </Section>
      <CTASection title="Open your account" body="Registration creates both accounts immediately — no deposit required to explore the platform." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/trading-conditions', label: 'Trading conditions' }} />
    </>
  );
}
