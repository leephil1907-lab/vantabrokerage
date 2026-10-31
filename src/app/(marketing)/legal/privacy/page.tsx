import { PageHero, Prose } from '@/components/marketing-ui';
export const metadata = { title: 'Privacy policy' };
export default function PrivacyPage() {
  return (<><PageHero eyebrow="Legal" title="Privacy policy" body="How this platform collects, uses and protects personal data." />
    <Prose>
      <h2>Data we collect</h2>
      <p>Account details (name, email, phone, country), identity documents for verification, session metadata (IP address, device), trading and transaction records, and support correspondence.</p>
      <h2>Why we process it</h2>
      <ul>
        <li>To operate your account and execute your instructions.</li>
        <li>To meet anti-money-laundering and know-your-customer obligations.</li>
        <li>To detect fraud, abuse and unauthorised access.</li>
        <li>To provide support and send service notifications.</li>
      </ul>
      <h2>Legal bases</h2>
      <p>Contract performance (operating your account), legal obligation (AML/KYC), and legitimate interests (security, fraud prevention, service integrity).</p>
      <h2>Sharing</h2>
      <p>We share data with market-data providers, custody and payment providers, identity-verification providers and regulators where legally required. Credentials for those providers are held in server-side environment configuration and are never exposed to clients.</p>
      <h2>Security</h2>
      <p>Passwords are hashed with bcrypt. Sessions are stored as hashes with device metadata and can be revoked. Access to administrative functions is role-based and audited.</p>
      <h2>Retention</h2>
      <p>Records are retained for the period required by financial regulation and then deleted or anonymised.</p>
      <h2>Your rights</h2>
      <p>You may request access, correction, export or deletion of your data. Deletion may be limited where retention is legally required. Use Settings → Data export or contact support.</p>
    </Prose></>);
}
