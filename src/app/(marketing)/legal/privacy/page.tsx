import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Privacy policy' };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      summary="What personal data the platform collects, why it is processed, how long it is kept and the controls available to you."
      breadcrumb="Privacy"
      updated="31 October 2026"
      sections={[
        { id: 'collect', title: 'Data we collect', body: (
          <ul>
            <li>Account details: name, email, phone, country, date of birth.</li>
            <li>Verification data: identity documents and their review outcome.</li>
            <li>Session metadata: IP address, user agent, timestamps, revocation status.</li>
            <li>Trading and financial records: orders, executions, positions, ledger entries, deposits and withdrawals.</li>
            <li>Support correspondence and tickets you raise.</li>
          </ul>
        ) },
        { id: 'why', title: 'Why we process it', body: (
          <ul>
            <li>To operate your account and execute your instructions.</li>
            <li>To meet anti-money-laundering and know-your-customer obligations.</li>
            <li>To detect fraud, abuse and unauthorised access.</li>
            <li>To provide support and resolve disputes.</li>
            <li>To meet legal, tax and regulatory record-keeping duties.</li>
          </ul>
        ) },
        { id: 'legal-basis', title: 'Legal basis', body: (
          <p>Processing is necessary to perform our contract with you, to comply with legal obligations, and — for security and service improvement — on the basis of our legitimate interests. Where consent is the basis (for example optional communications), you may withdraw it at any time.</p>
        ) },
        { id: 'sharing', title: 'Who we share data with', body: (
          <p>Only where necessary: identity verification providers, blockchain explorers used to confirm deposits, payment providers, and regulators or law enforcement where legally compelled. We do not sell personal data and we do not load advertising or cross-site tracking scripts.</p>
        ) },
        { id: 'retention', title: 'Retention', body: (
          <p>Transaction and identity records are retained for the period required by applicable financial-crime and tax rules. Session records are retained for a shorter security window. When retention expires, data is deleted or irreversibly anonymised.</p>
        ) },
        { id: 'security', title: 'How we protect it', body: (
          <p>Passwords are hashed with bcrypt. Session tokens are stored as hashes with device metadata and can be revoked individually. Two-factor authentication is available for sign-in and required for withdrawals. Access to administrative data is role-based and every privileged action is logged with actor, IP and before/after state.</p>
        ) },
        { id: 'rights', title: 'Your rights', body: (
          <p>Depending on your jurisdiction you may request access to, correction of, or erasure of your personal data, and may object to or restrict certain processing. Where processing rests on consent you may withdraw it. Requests can be made through the <a href="/dashboard/support">support desk</a> once signed in, and identity will be verified before action.</p>
        ) },
        { id: 'contact', title: 'Contact', body: (
          <p>Privacy questions can be raised through the <a href="/contact">contact</a> page or a support ticket from your dashboard.</p>
        ) },
      ]}
    />
  );
}
