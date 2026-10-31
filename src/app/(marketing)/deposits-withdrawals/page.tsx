import { PageHero, Section, FeatureGrid, CTASection } from '@/components/marketing-ui';

export const metadata = { title: 'Deposits and withdrawals' };

export default function DepositsPage() {
  return (
    <>
      <PageHero eyebrow="Funding" title="Deposits and withdrawals with proper controls" body="Funding runs through a reviewable workflow: on-chain verification, finance approval, reservation and release. Balances are posted to a double-entry ledger, never edited in place." />
      <Section title="How deposits work">
        <FeatureGrid items={[
          { title: 'Crypto deposits', body: 'Send to the custody address shown for your asset, then submit the transaction hash. Confirmations are checked with the configured explorer/provider.' },
          { title: 'Manual review fallback', body: 'Without a blockchain provider configured, deposits are queued for the finance desk rather than auto-credited.' },
          { title: 'Idempotent crediting', body: 'A deposit can only be credited once. Duplicate transaction hashes are rejected at submission.' },
          { title: 'Card & bank providers', body: 'Available only when a payment processor is configured for the deployment; the UI states clearly when it is not.' },
          { title: 'Notifications', body: 'You are notified when a deposit is recorded and again when it is credited.' },
          { title: 'Referral qualification', body: 'Referred accounts qualify for commission on verified credited deposits only.' },
        ]} />
      </Section>
      <Section title="How withdrawals work">
        <FeatureGrid items={[
          { title: 'Identity gate', body: 'Withdrawals require an approved verification record. Status is surfaced in the dashboard, never hidden.' },
          { title: 'Re-authentication', body: 'Password plus TOTP (when enabled) is required before funds are reserved.' },
          { title: 'Immediate reservation', body: 'The amount moves from available to locked, so it cannot be spent on a trade while under review.' },
          { title: 'Finance authorisation', body: 'Requests are approved or rejected by the finance desk; rejections release the reservation back to available.' },
          { title: 'Completion with proof', body: 'A withdrawal is only marked completed with a provider or blockchain transaction hash.' },
          { title: 'Limits & fees', body: 'Minimums, percentage fee and daily limits are enforced server-side and visible in your dashboard.' },
        ]} />
      </Section>
      <CTASection title="Fund your live account" body="Register to access your wallet, address book and withdrawal workflow." primary={{ href: '/register', label: 'Open account' }} secondary={{ href: '/trading-conditions', label: 'Fees & limits' }} />
    </>
  );
}
