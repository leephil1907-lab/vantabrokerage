import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'AML policy' };

export default function AmlPage() {
  return (
    <LegalPage
      title="Anti-money-laundering policy"
      summary="The controls this platform applies to prevent financial crime, and how they are enforced and recorded."
      breadcrumb="AML"
      updated="31 October 2026"
      sections={[
        { id: 'cdd', title: 'Customer due diligence', body: (
          <p>Identity verification is required before withdrawals. Submissions are reviewed by compliance and either approved or rejected with a stated reason. Document data is stored against your verification record and is visible only to authorised staff.</p>
        ) },
        { id: 'monitoring', title: 'Transaction monitoring', body: (
          <p>Deposits require on-chain verification or manual finance review. Duplicate transaction hashes are rejected. Withdrawals require re-authentication, reservation of funds and finance authorisation, and completion is recorded with a transaction reference.</p>
        ) },
        { id: 'records', title: 'Record keeping', body: (
          <p>All wallet, trading and administrative actions are recorded with timestamps and, for administrative actions, the responsible staff member, IP address and before/after state. Ledger entries are immutable and reconciled by automated checks.</p>
        ) },
        { id: 'reporting', title: 'Suspicious activity reporting', body: (
          <p>Where activity appears suspicious, the platform may restrict an account and file a report with the relevant authority. We may be prevented by law from telling you that a report has been made.</p>
        ) },
        { id: 'abuse', title: 'Platform abuse', body: (
          <p>Exploiting bugs, attempting to manipulate quotes, using unauthorised automated access, or opening accounts with false identity is prohibited and results in restriction and possible referral to authorities.</p>
        ) },
      ]}
    />
  );
}
