import { PageHero, Prose } from '@/components/marketing-ui';
export const metadata = { title: 'AML policy' };
export default function AmlPage() {
  return (<><PageHero eyebrow="Legal" title="Anti-money-laundering policy" body="Controls this platform applies to prevent financial crime." />
    <Prose>
      <h2>Customer due diligence</h2>
      <p>Identity verification is required before withdrawals. Submissions are reviewed by compliance and either approved or rejected with a stated reason. Document data is stored against the client&apos;s verification record and is visible only to authorised staff.</p>
      <h2>Transaction monitoring</h2>
      <p>Deposits require on-chain verification or manual finance review. Duplicate transaction hashes are rejected. Withdrawals require re-authentication, reservation of funds and finance authorisation, and completion is recorded with a transaction hash.</p>
      <h2>Record keeping</h2>
      <p>All wallet, trading and administrative actions are recorded with timestamps and, for administrative actions, the responsible staff member, IP address and before/after state.</p>
      <h2>Reporting</h2>
      <p>Suspicious activity is escalated to the compliance officer. Accounts may be restricted or suspended pending investigation, and reports filed with the competent authority where required.</p>
      <h2>Prohibited jurisdictions</h2>
      <p>Accounts from restricted jurisdictions are not accepted. The operating entity must configure and enforce its restricted list before commercial launch.</p>
    </Prose></>);
}
