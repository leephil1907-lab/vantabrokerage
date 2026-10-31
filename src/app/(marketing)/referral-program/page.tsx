import { PageHero, Section, StatBand, FeatureGrid, Callout, CTASection, SpecTable, Split } from '@/components/marketing-ui';
import { Accordion } from '@/components/accordion';

export const metadata = { title: 'Referral program' };

const FAQS = [
  { q: 'When is commission paid?', a: 'Commission accrues when a referred client’s deposit is verified and credited to the ledger — not at registration and not on clicking a link. Accrued commission is reviewed by the affiliate desk before payout.' },
  { q: 'What is the rate?', a: 'The rate is stored in platform configuration (currently 15% of verified referred deposits) and is shown in your referral dashboard. Rate changes apply prospectively and are audit-logged.' },
  { q: 'What disqualifies a referral?', a: 'Self-referral, duplicate or synthetic accounts, incentivised abuse and accounts that fail verification. Rejected entries are never paid.' },
  { q: 'How do I get paid?', a: 'Approved commission is credited to your live account as a ledger transaction, so it is traceable in your transactions list like any other movement.' },
];

export default function ReferralPage() {
  return (
    <>
      <PageHero
        eyebrow="Referral program"
        title="Earn from verified referred deposits"
        body="Every account has a unique referral code and link. When a referred client's deposit is verified and credited, commission accrues at the rate held in platform configuration and is reviewed by the affiliate desk before it is paid."
        breadcrumbs={[{ label: 'Referral program' }]}
        aside={<StatBand items={[
          { k: '15%', label: 'Commission rate', sub: 'from configuration' },
          { k: '1', label: 'Unique code per account', sub: 'issued at registration' },
          { k: 'ledger', label: 'Payout method', sub: 'auditable credit' },
          { k: 'review', label: 'Affiliate desk approval', sub: 'before payout' },
        ]} />}
      />
      <Section eyebrow="Mechanics" title="How the program works">
        <Split
          left={<FeatureGrid cols={2} items={[
            { title: 'Share your link', body: 'Your code is generated at registration and accepted by any registration form.' },
            { title: 'Signups tracked', body: 'Referred registrations appear in your dashboard with their current status.' },
            { title: 'Qualification', body: 'A referral qualifies when its deposit is verified and recorded in the ledger.' },
            { title: 'Commission accrual', body: 'Computed from verified deposit amounts at the configured rate.' },
            { title: 'Review', body: 'The affiliate desk approves eligible commissions; rejected entries are never paid.' },
            { title: 'Payout', body: 'Approved commission credits your live account through the ledger.' },
          ]} />}
          right={
            <div className="space-y-3">
              <SpecTable
                columns={['Event', 'Effect on commission']}
                rows={[
                  ['Registration', 'None'],
                  ['Deposit submitted', 'None'],
                  ['Deposit verified + credited', 'Accrues at rate'],
                  ['Affiliate desk approval', 'Eligible for payout'],
                  ['Payout', 'Credited to live account'],
                ]}
                caption="Commission is never based on unverified deposits or hypothetical trading volume."
              />
              <Callout tone="info" title="Rules">
                Self-referrals, duplicate accounts and incentivised abuse are rejected. Payouts require an active account with completed verification.
              </Callout>
            </div>
          }
        />
      </Section>
      <Section eyebrow="Questions" title="Referral FAQ" tight><Accordion items={FAQS} /></Section>
      <CTASection title="Start earning" body="Register to get your referral link instantly in the dashboard." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/help', label: 'Help centre' }} />
    </>
  );
}
