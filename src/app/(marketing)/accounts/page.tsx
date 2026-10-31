import Link from 'next/link';
import { PageHero, Section, StatBand, Callout, CTASection, SpecTable } from '@/components/marketing-ui';
import { Accordion } from '@/components/accordion';

export const metadata = { title: 'Account environments' };

const FAQS = [
  { q: 'Do I need to deposit to try the platform?', a: 'No. Registration creates a paper account with simulated funds. Do not deposit real money into this demonstration.' },
  { q: 'Can I place live trades?', a: 'No. Live account order entry is disabled. A live execution adapter has not been implemented, and changing an environment setting will not enable one.' },
  { q: 'Can paper funds be transferred to a live account?', a: 'No. Transfers between paper and live account types are blocked in both directions.' },
  { q: 'Are paper results the same as live results?', a: 'No. Paper orders are simulated against provider-sourced quotes. Spreads, depth, liquidity, slippage and execution may differ substantially from real markets.' },
];

export default function AccountsPage() {
  return (
    <>
      <PageHero
        eyebrow="Accounts"
        title="Explore the markets on paper"
        body="Practise forex and crypto trading with simulated funds. Paper and live account records are kept separate; live execution is not available in this demonstration."
        breadcrumbs={[{ label: 'Accounts' }]}
        aside={<StatBand items={[
          { k: 'PAPER', label: 'Available environment', sub: 'simulated funds' },
          { k: 'LIVE', label: 'Execution', sub: 'not implemented' },
          { k: 'FX', label: 'Forex desks', sub: 'provider-sourced quotes' },
          { k: 'CRYPTO', label: 'Digital assets', sub: 'spot + perpetuals on paper' },
        ]} />}
      />
      <Section eyebrow="Account environments" title="Know which environment you are using">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-lime/30 bg-ink-850/70 p-6 ring-1 ring-lime/10">
            <span className="eyebrow">Available now</span>
            <h3 className="mt-3 text-lg font-semibold text-white">Paper account</h3>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">A simulated balance for exploring forex, crypto and other supported desks. Orders are internally simulated, not routed to an exchange or broker.</p>
            <Link href="/register" className="btn-primary mt-6 self-start">Create paper account</Link>
          </div>
          <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-ink-850/70 p-6">
            <span className="label">Not available for trading</span>
            <h3 className="mt-3 text-lg font-semibold text-white">Live account record</h3>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">A separate account record exists for future development. Live order routing, automated custody and verified deposits are not connected.</p>
            <Link href="/contact" className="btn-ghost mt-6 self-start">Contact support</Link>
          </div>
        </div>
      </Section>
      <Section eyebrow="Details" title="Paper and live, clearly separated">
        <SpecTable columns={['Capability', 'Paper', 'Live']} rows={[
          ['Forex and crypto order entry', 'Simulated', 'Unavailable'],
          ['Balance', 'Simulated', 'Not for real funds'],
          ['Transfer between environments', 'Not permitted', 'Not permitted'],
          ['Market data', 'Provider-sourced, subject to availability', 'Not an execution feed'],
        ]} caption="Market depth is modeled; quoted prices and simulated outcomes are not live execution." />
        <div className="mt-4"><Callout tone="warn" title="Demonstration only">Do not deposit real funds. A live brokerage launch requires regulated providers, security review and operational controls.</Callout></div>
      </Section>
      <Section eyebrow="Questions" title="Account FAQ" tight><Accordion items={FAQS} /></Section>
      <CTASection title="Start with a paper account" body="Explore forex and crypto with simulated funds—no payment details required." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/markets', label: 'Explore markets' }} />
    </>
  );
}
