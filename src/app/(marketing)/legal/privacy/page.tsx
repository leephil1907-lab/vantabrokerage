import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Privacy policy' };

export default function PrivacyPage() {
  return <LegalPage title="Privacy policy" summary="What we collect, why we collect it, who it is shared with, how long we keep it and the rights you hold over it." breadcrumb="Privacy" updated="4 November 2026" version="2.0" sections={[
    { id: 'controller', title: '1. Controller and contact', body: <>
      <p>The PRIMEVEST operating entity (&ldquo;PRIMEVEST&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is the controller of personal data processed through the Platform. Privacy questions and rights requests can be submitted through the <a href="/contact">contact page</a> or the in-product support chat; we acknowledge requests promptly and respond within the periods required by applicable law.</p>
    </> },
    { id: 'data', title: '2. Data we collect', body: <>
      <p><strong>Identity and contact data:</strong> name, email address, country of residence and credentials you register with.</p>
      <p><strong>Verification data:</strong> documents and information submitted for identity and address verification under our AML obligations, including screening results.</p>
      <p><strong>Account and trading records:</strong> environment type, balances, orders, executions, positions, ledger entries and wallet addresses you use for funding or withdrawals.</p>
      <p><strong>Technical data:</strong> IP address, device and browser characteristics, session security tokens and security logs.</p>
      <p><strong>Communication data:</strong> support chat transcripts and messages exchanged with our team.</p>
    </> },
    { id: 'purposes', title: '3. Purposes and legal bases', body: <>
      <p>We process personal data to perform our contract with you (operating accounts, executing orders, maintaining the ledger, providing support); to comply with legal obligations (anti-money-laundering, sanctions, tax and regulatory record-keeping); for our legitimate interests in security, fraud prevention, dispute resolution and service improvement; and, where applicable, on your consent for optional communications, which you may withdraw at any time.</p>
    </> },
    { id: 'kyc', title: '4. Verification and AML processing', body: <>
      <p>Identity verification, sanctions and politically-exposed-person screening and transaction monitoring are performed under our <a href="/legal/aml">AML policy</a>. Verification documents are accessed only by compliance staff and processors bound by confidentiality, and are retained for the periods mandated by applicable AML law even after account closure.</p>
    </> },
    { id: 'funding', title: '5. Funding and on-chain data', body: <>
      <p>Deposits and withdrawals in crypto assets involve wallet addresses and transaction hashes. On-chain data is public by design; we record the references needed to reconcile your ledger and meet AML obligations. We do not operate card or bank payment rails and therefore do not collect card numbers or bank credentials.</p>
    </> },
    { id: 'sharing', title: '6. Who we share data with', body: <>
      <p>We share personal data only with: infrastructure and hosting processors operating the Platform (compute, database and storage providers); verification and screening vendors; professional advisers; and regulators, tax authorities or law enforcement where a lawful request obliges us. Processors act on documented instructions with appropriate security. We do not sell personal data and do not share it for third-party advertising.</p>
    </> },
    { id: 'transfers', title: '7. International transfers', body: <>
      <p>Platform infrastructure operates in European and United States regions. Where personal data is transferred outside your jurisdiction, we rely on lawful transfer mechanisms such as adequacy decisions or standard contractual clauses, together with technical safeguards including encryption in transit and at rest.</p>
    </> },
    { id: 'security', title: '8. Security', body: <>
      <p>We apply encryption in transit and at rest, role-based access control with least-privilege principles, mandatory two-factor authentication for staff and customers, audit logging of sensitive operations and continuous dependency and secret hygiene practices. No system is perfectly secure; if an incident affects your personal data we will notify you and authorities where required.</p>
    </> },
    { id: 'retention', title: '9. Retention', body: <>
      <p>Account, trading and funding records are retained for the duration of the relationship plus the periods required by financial-regulation and AML law (commonly five years, longer where a matter remains open). Support transcripts are kept with the account record. Security logs are retained on a rolling basis. Data no longer required is deleted or irreversibly anonymised.</p>
    </> },
    { id: 'rights', title: '10. Your rights', body: <>
      <p>Subject to applicable law and to AML retention obligations, you may request access to your personal data, correction of inaccuracies, deletion, restriction of processing, portability of data you provided, and object to processing based on legitimate interests. Exercise rights through the contact channel; we verify identity before acting. You may also lodge a complaint with your supervisory authority.</p>
    </> },
    { id: 'cookies', title: '11. Cookies and local storage', body: <>
      <p>Our use of cookies and device storage is limited to what the Platform needs to function and to remember your preferences, as described in the <a href="/legal/cookies">cookie policy</a>. We do not use advertising trackers.</p>
    </> },
    { id: 'children', title: '12. Children', body: <>
      <p>The Platform is intended solely for persons aged 18 and over. We do not knowingly collect personal data from minors and will delete such data and close accounts if discovered.</p>
    </> },
    { id: 'changes', title: '13. Changes', body: <>
      <p>We may update this policy as the Platform or the law evolves. Material changes are notified through the Platform or by email before taking effect, and the version date above is updated accordingly.</p>
    </> },
  ]} />;
}
