import { PageHero, Section, FeatureGrid, CTASection } from '@/components/marketing-ui';

export const metadata = { title: 'Referral program' };

export default function ReferralPage() {
  return (
    <>
      <PageHero eyebrow="Referral program" title="Earn from verified referred deposits" body="Every account has a unique referral code and link. When a referred client's deposit is verified and credited, commission accrues at the platform rate and is reviewed by the affiliate desk before payout." />
      <Section title="How it works">
        <FeatureGrid items={[
          { title: 'Share your link', body: 'Your code is generated at registration and can be used in any registration form.' },
          { title: 'Registration tracked', body: 'Referred signups appear in your referral dashboard with their status.' },
          { title: 'Qualification', body: 'A referral qualifies when its deposit is verified, credited and recorded in the ledger.' },
          { title: 'Commission accrual', body: 'Commission is computed from verified amounts at the configured rate — currently 15%.' },
          { title: 'Review & approval', body: 'The affiliate desk approves eligible commissions; rejected entries are never paid.' },
          { title: 'Payout', body: 'Approved commission is credited to your live account as a ledger transaction.' },
        ]} />
      </Section>
      <Section title="Rules" tight>
        <div className="panel p-5 text-[12.5px] leading-relaxed text-muted">
          <ul className="space-y-2">
            <li>• Self-referrals, duplicate accounts and incentivised abuse are rejected.</li>
            <li>• Commission is based on verified deposit amounts, not on trading volume or hypothetical activity.</li>
            <li>• The platform may adjust the rate prospectively; existing accrued commissions are unaffected.</li>
            <li>• Payouts require an active, compliant account with completed identity verification.</li>
          </ul>
        </div>
      </Section>
      <CTASection title="Start earning" body="Register to get your referral link instantly in the dashboard." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/help', label: 'Read the help center' }} />
    </>
  );
}
