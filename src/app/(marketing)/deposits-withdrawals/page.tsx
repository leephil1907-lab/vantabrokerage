import Link from 'next/link';
import { PageHero, Section, StatBand, FeatureGrid, Callout, CTASection, SpecTable, Split } from '@/components/marketing-ui';
import { Accordion } from '@/components/accordion';

export const metadata = { title: 'Deposits and withdrawals' };

const FAQS = [
  { q: 'How long do withdrawals take?', a: 'The platform does not advertise a fixed SLA it cannot verify. A request moves through: re-authentication → funds locked → finance review → paid (recorded with a transaction hash). Each step has a timestamp and an actor, and the current state is visible in your dashboard at all times.' },
  { q: 'Why is my deposit pending?', a: 'Either the on-chain transaction has not reached the required confirmations, or no payment provider is connected for that rail and a finance operator must approve it. Pending means pending — the platform will not show a credit that has not happened.' },
  { q: 'What do I need to withdraw?', a: 'Approved identity verification, re-authentication with your password plus two-factor if enabled, and available balance. Requests lock the amount immediately so it cannot be spent twice.' },
  { q: 'Can I deposit by card or bank?', a: 'The rails are implemented as reviewable workflows. Card and bank processors are provider-dependent; if no provider is configured your deposit queues for finance review rather than failing silently or auto-crediting.' },
  { q: 'Are there deposit fees?', a: 'Network fees on crypto deposits are set by the blockchain, not the platform. Trading fees are listed per instrument on the trading-conditions page.' },
];

export default function DepositsPage() {
  return (
    <>
      <PageHero
        eyebrow="Funding"
        title="Deposits and withdrawals with controls you can see"
        body="Funding runs through a reviewable workflow: on-chain verification or finance approval, reservation, then release. Every movement posts to a double-entry ledger — no balance is ever edited in place."
        breadcrumbs={[{ label: 'Deposits & withdrawals' }]}
        aside={<StatBand items={[
          { k: '4', label: 'Withdrawal states', sub: 'locked → review → paid' },
          { k: '2FA', label: 'Required to withdraw', sub: 'plus password' },
          { k: 'KYC', label: 'Gate before payout', sub: 'approved only' },
          { k: 'txHash', label: 'Proof of payment', sub: 'on completion' },
        ]} />}
      >
        <div className="flex flex-wrap gap-2">
          {['Crypto (on-chain)', 'Card (review)', 'Bank transfer (review)', 'Wallet transfer'].map((t) => <span key={t} className="chip">{t}</span>)}
        </div>
      </PageHero>

      <Section eyebrow="Workflow" title="What actually happens to your money">
        <Split
          left={
            <div className="space-y-3">
              {[
                ['1 · Request', 'You submit a deposit hash or a withdrawal request. Withdrawals require your password and, if enabled, a TOTP code.'],
                ['2 · Verify', 'Crypto deposits are checked against the configured explorer. Withdrawal requests are checked against KYC status and available balance.'],
                ['3 · Reserve or review', 'Withdrawal funds are locked immediately. Anything needing a provider or a human decision enters the finance queue with a reason recorded.'],
                ['4 · Post to ledger', 'Credits, debits and releases are written as balanced double-entry transactions — visible in your transactions list.'],
              ].map(([t, b]) => (
                <div key={t} className="rounded-xl border border-white/[0.07] bg-ink-850/70 p-4">
                  <p className="text-[12.5px] font-semibold text-white">{t}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">{b}</p>
                </div>
              ))}
            </div>
          }
          right={
            <div className="space-y-3">
              <SpecTable
                columns={['State', 'Meaning', 'Who acts']}
                rows={[
                  ['PENDING', 'Awaiting verification or review', 'System / finance'],
                  ['LOCKED', 'Funds reserved, cannot be spent', 'Client'],
                  ['APPROVED', 'Cleared, awaiting payment', 'Finance'],
                  ['COMPLETED', 'Paid with transaction hash', 'Finance'],
                  ['REJECTED', 'Refused with reason, funds released', 'Finance'],
                ]}
                caption="Every state change is written to the audit log with actor, IP and timestamp."
              />
              <Callout tone="ok" title="No fabricated payments">
                A payment is only marked complete when a transaction reference exists on record. Pending requests never display as paid.
              </Callout>
            </div>
          }
        />
      </Section>

      <Section eyebrow="Controls" title="Why funding is gated">
        <FeatureGrid items={[
          { title: 'KYC before payout', body: 'Withdrawals require approved identity verification. Submissions are reviewed by compliance with a stated decision.' },
          { title: 'Re-authentication', body: 'A stolen session cannot move money: withdrawals require your password and two-factor code again.' },
          { title: 'Duplicate-hash rejection', body: 'A crypto transaction hash can only be credited once, checked at submission and again at credit.' },
          { title: 'Locked balances', body: 'Requested funds leave your available balance immediately, so the same money cannot be used for trading and a payout.' },
          { title: 'Finance audit trail', body: 'Approvals, rejections and completions record the staff member, IP address and before/after state.' },
          { title: 'Honest status', body: 'If a provider is not connected, the request is queued and labelled — never silently "succeeded".' },
        ]} />
      </Section>

      <Section eyebrow="Questions" title="Funding FAQ" tight><Accordion items={FAQS} /></Section>

      <CTASection
        title="Fund a verified account"
        body="Complete verification once and every future deposit and withdrawal stays inside an auditable workflow."
        primary={{ href: '/register', label: 'Create account' }}
        secondary={{ href: '/trading-conditions', label: 'Fees & conditions' }}
        footnote="Deposits are credited only after verification or finance approval. Simulated accounts never hold real funds."
      />
    </>
  );
}
