import Link from 'next/link';
import { PageHero, Section, StatBand, Callout, CTASection, SpecTable, Split } from '@/components/marketing-ui';

export const metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the desk"
        body="Support runs through the dashboard ticket system, so every conversation is attached to your account, timestamped and auditable. For pre-registration questions, use the routes below."
        breadcrumbs={[{ label: 'Contact' }]}
        aside={<StatBand items={[
          { k: '24/7', label: 'Account access', sub: 'terminals + wallet' },
          { k: 'ticket', label: 'Primary channel', sub: 'in-dashboard, audited' },
          { k: 'KYC', label: 'Compliance queue', sub: 'verification reviews' },
          { k: 'finance', label: 'Payment review', sub: 'deposits & withdrawals' },
        ]} />}
      />
      <Section eyebrow="Channels" title="How to reach the right team">
        <Split
          left={
            <div className="space-y-3">
              {[
                ['Client support', 'Sign in → Support → New ticket', 'Every ticket records category, priority and full conversation history. Replies notify you in the dashboard.'],
                ['Compliance & verification', 'Sign in → Verification', 'Document submission, review status and the decision reason are visible on the verification page.'],
                ['Payments & finance review', 'Sign in → Deposits / Withdrawals', 'Each request shows its state, the reason it is waiting and who last acted on it.'],
                ['Account security', 'Sign in → Security', 'Rotate your password, enable TOTP two-factor and review active sessions with device and IP details.'],
              ].map(([t, where, body]) => (
                <div key={t} className="rounded-xl border border-white/[0.07] bg-ink-850/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-white">{t}</p>
                    <span className="chip">{where}</span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          }
          right={
            <div className="space-y-3">
              <SpecTable
                columns={['Enquiry', 'Where it is handled']}
                rows={[
                  ['Trading issue', 'Support ticket'],
                  ['Verification', 'Verification page'],
                  ['Deposit / withdrawal', 'Funding pages'],
                  ['Security', 'Security page'],
                  ['Complaint', 'Support ticket (escalated)'],
                ]}
                caption="Tickets and funding actions are recorded with actor and timestamp for audit."
              />
              <Callout tone="info" title="Why no public email form">
                Identity and account data must be handled inside the authenticated platform, where the request is provably tied to your
                account. A public form would create an unverifiable channel for account changes.
              </Callout>
              <Link href="/register" className="btn-primary w-full py-2.5 text-[13px]">Create an account</Link>
            </div>
          }
        />
      </Section>
      <CTASection title="Already a client?" body="Sign in to open a ticket, review verification or check the state of a payment." primary={{ href: '/login', label: 'Sign in' }} secondary={{ href: '/help', label: 'Help centre' }} />
    </>
  );
}
