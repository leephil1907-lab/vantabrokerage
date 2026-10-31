import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Terms and conditions' };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and conditions"
      summary="The agreement between you and PRIMEVEST covering your account, orders, balances and the platform's obligations."
      breadcrumb="Terms"
      updated="31 October 2026"
      sections={[
        { id: 'account', title: 'Your account', body: (
          <>
            <p>You must provide accurate registration information and keep your credentials secure. One person may hold one account unless a corporate structure is approved by compliance. You are responsible for all activity under your credentials, and you must tell us immediately if you believe they have been compromised.</p>
            <p>We may restrict, suspend or close an account where required by law, where verification fails, or where we detect abuse, fraud or attempts to manipulate platform systems.</p>
          </>
        ) },
        { id: 'execution', title: 'Orders and execution', body: (
          <>
            <p>Orders are executed server-side against the platform's prevailing quote for the instrument, which records its provider and timestamp. You do not set prices; you submit an intent, and the server validates, prices and settles it.</p>
            <p><strong>Execution environment.</strong> The platform displays whether an account is PAPER (simulated) or LIVE. Where live execution is not connected to a provider, live orders are rejected rather than simulated silently. Paper results are not indicative of live performance.</p>
          </>
        ) },
        { id: 'balances', title: 'Balances and the ledger', body: (
          <p>Balances are derived from a double-entry ledger. Every movement — deposit, trade settlement, fee, funding, transfer or withdrawal — is a balanced transaction. We do not edit balances in place, and no member of staff can create a balance without a corresponding ledger entry recorded against their identity.</p>
        ) },
        { id: 'fees', title: 'Fees and charges', body: (
          <p>Trading fees, leverage caps and payout rates are published on the <a href="/trading-conditions">trading conditions</a> page, read live from platform configuration. Changes apply prospectively and are recorded in the audit log.</p>
        ) },
        { id: 'funding', title: 'Deposits and withdrawals', body: (
          <>
            <p>Automated deposit verification is not connected. Deposit crediting requires finance approval in this demonstration. Withdrawal requests require approved identity verification and re-authentication, and move through a reviewable state machine; completion is recorded with a transaction reference.</p>
            <p>We may decline a withdrawal where the source of funds cannot be verified, where a payment provider is unavailable, or where an investigation is open.</p>
          </>
        ) },
        { id: 'risk', title: 'Risk acknowledgement', body: (
          <p>Leveraged, derivative and short-expiry products carry a high risk of rapid loss. You should read the <a href="/legal/risk-disclosure">risk disclosure</a> before trading. Nothing on this platform is investment advice.</p>
        ) },
        { id: 'ip', title: 'Intellectual property', body: (
          <p>The platform, its interface and its documentation are our property. Third-party instrument names, marks and logos are the property of their respective owners and are used for identification only; their appearance does not imply affiliation or endorsement.</p>
        ) },
        { id: 'liability', title: 'Liability', body: (
          <p>To the extent permitted by law, we are not liable for indirect or consequential loss, or for loss arising from market movement, provider outages, or your failure to secure your credentials. Nothing in these terms excludes liability that cannot lawfully be excluded.</p>
        ) },
        { id: 'changes', title: 'Changes and governing terms', body: (
          <p>We may amend these terms; material changes are notified before they take effect. Continued use after the effective date constitutes acceptance. These terms are governed by the laws applicable to the operating entity named in your account documentation.</p>
        ) },
      ]}
    />
  );
}
