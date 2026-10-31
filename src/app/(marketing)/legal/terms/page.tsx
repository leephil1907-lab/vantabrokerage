import { PageHero, Prose } from '@/components/marketing-ui';
export const metadata = { title: 'Terms and conditions' };
export default function TermsPage() {
  return (<><PageHero eyebrow="Legal" title="Terms and conditions" body="Template terms for this deployment. Replace with counsel-approved terms before operating commercially." />
    <Prose>
      <p><strong>Last updated:</strong> {new Date().toISOString().slice(0, 10)}</p>
      <h2>1. Agreement</h2>
      <p>These terms govern your use of the Vanta Markets platform (&quot;the Platform&quot;). By registering you accept them. If you do not accept them, do not use the Platform.</p>
      <h2>2. Eligibility</h2>
      <p>You must be at least 18 years old, legally able to enter contracts, and not resident in a restricted jurisdiction. You are responsible for compliance with local law.</p>
      <h2>3. Accounts</h2>
      <p>Each client receives a live account and a paper account. Balances, positions and history are separate. Paper trading uses simulated funds and does not represent real market execution or real profit and loss.</p>
      <h2>4. Client funds</h2>
      <p>Deposits are credited only after verification through a configured provider or manual finance review. Withdrawals require approved identity verification, re-authentication and finance authorisation. Balances are recorded in a double-entry ledger.</p>
      <h2>5. Trading</h2>
      <p>Orders are executed at prices derived from server-side market data. You accept the risk of slippage, gapping and liquidation. Leverage amplifies both gains and losses. Short-expiry products may result in the total loss of the staked amount.</p>
      <h2>6. Prohibited conduct</h2>
      <p>You may not use the Platform for money laundering, terrorist financing, market manipulation, fraud, or any activity that breaches applicable law. We may suspend accounts and report suspicious activity.</p>
      <h2>7. Availability</h2>
      <p>The Platform may be unavailable during maintenance or when a data or execution provider fails. Where live execution is not connected, the feature is disabled rather than simulated.</p>
      <h2>8. Liability</h2>
      <p>To the maximum extent permitted by law, we are not liable for indirect or consequential loss arising from trading losses, provider outages or third-party failures.</p>
      <h2>9. Changes</h2>
      <p>We may amend these terms prospectively. Continued use after the effective date constitutes acceptance.</p>
      <h2>10. Governing law</h2>
      <p>These terms are governed by the laws of the operating entity&apos;s jurisdiction, which must be specified before commercial launch.</p>
    </Prose></>);
}
