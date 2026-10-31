import Link from 'next/link';
import { PageHero, Section, StatBand, FeatureGrid, Callout, CTASection, SpecTable, Split } from '@/components/marketing-ui';
import { Accordion } from '@/components/accordion';

export const metadata = { title: 'Deposits and withdrawals' };

const FAQS = [
  { q: 'How long do withdrawals take?', a: 'The platform does not advertise a fixed SLA it cannot verify. A request moves through: re-authentication → funds locked → finance review → paid (recorded with a transaction hash). Each step has a timestamp and an actor, and the current state is visible in your dashboard at all times.' },
  { q: 'Why is my deposit pending?', a: 'Automated deposit verification is not connected. A finance operator must independently review the transaction before it can be credited. Pending means no credit has been posted.' },
  { q: 'What do I need to withdraw?', a: 'Approved identity verification, re-authentication with your password plus two-factor if enabled, and available balance. Requests lock the amount immediately so it cannot be spent twice.' },
  { q: 'Can I deposit by card or bank?', a: 'Card and bank deposit integrations are not implemented in this demonstration. Do not deposit real funds.' },
  { q: 'Are there deposit fees?', a: 'Network fees on crypto deposits are set by the blockchain, not the platform. Trading fees are listed per instrument on the trading-conditions page.' },
];

export default function DepositsPage() {
  return (
    <>
      <PageHero
        eyebrow="Funding"
        title="Funding workflows in demonstration mode"
        body="Do not deposit real funds. Automated verification, custody and card or bank payment integrations are not connected. The current screens demonstrate review and ledger workflows only."
        breadcrumbs={[{ label: 'Deposits & withdrawals' }]}
        aside={<StatBand items={[
          { k: '4', label: 'Withdrawal states', sub: 'locked → review → paid' },
          { k: '2FA', label: 'Withdrawal check', sub: 'when enabled, plus password' },
          { k: 'KYC', label: 'Gate before payout', sub: 'approved only' },
          { k: 'txHash', label: 'Payment reference', sub: 'recorded by finance' },
        ]} />}
      >
        <div className="flex flex-wrap gap-2">
          {['Crypto review (demo)', 'Card unavailable', 'Bank unavailable', 'Same-environment transfers'].map((t) => <span key={t} className="chip">{t}</span>)}
        </div>
      </PageHero>

      <Section eyebrow="Workflow" title="What actually happens to your money">
        <Split
          left={
            <div className="space-y-3">
              {[
                ['1 · Request', 'You submit a deposit hash or a withdrawal request. Withdrawals require your password and, if enabled, a TOTP code.'],
                ['2 · Verify', 'Automated on-chain deposit verification is not connected. Withdrawal requests are checked against KYC status and available balance.'],
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
          { title: 'Re-authentication', body: 'Withdrawals require your password and, when enabled, your two-factor code again.' },
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
        footnote="Automated verification is not connected. Do not deposit real funds in this demonstration."
      />
    </>
  );
}
