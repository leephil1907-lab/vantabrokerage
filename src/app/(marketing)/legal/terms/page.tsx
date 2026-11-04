import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Terms and conditions' };

export default function TermsPage() {
  return <LegalPage title="Terms and conditions" summary="The agreement between you and PRIMEVEST governing access to the platform, your accounts, order execution and funding." breadcrumb="Terms" updated="4 November 2026" version="2.0" sections={[
    { id: 'agreement', title: '1. Agreement and eligibility', body: <>
      <p>These terms and conditions (&ldquo;Terms&rdquo;) form the agreement between you and the PRIMEVEST operating entity (&ldquo;PRIMEVEST&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) and govern your access to and use of the PRIMEVEST website, terminal and related services (the &ldquo;Platform&rdquo;). By registering an account or using the Platform you confirm that you have read, understood and accepted these Terms together with the <a href="/legal/privacy">privacy policy</a>, <a href="/legal/risk-disclosure">risk disclosure</a> and <a href="/legal/aml">AML policy</a>.</p>
      <p>You may use the Platform only if you are at least 18 years old and of legal age to enter binding contracts in your jurisdiction of residence, and only if your use is lawful there. You are responsible for determining whether trading leveraged products and crypto assets is permitted where you live. We may refuse or restrict service in any jurisdiction at our discretion.</p>
    </> },
    { id: 'accounts', title: '2. Opening and maintaining your account', body: <>
      <p>Registration requires accurate, complete and current information. Before live trading or funding we verify your identity under our <a href="/legal/aml">AML policy</a>; verification is reviewed by our compliance team and approval is manual. One individual account per person is permitted.</p>
      <p>You are responsible for the confidentiality of your credentials and for all activity under your account. Enable two-factor authentication and notify us immediately through the support channel if you suspect unauthorised access. We may suspend access while a security or compliance concern is investigated.</p>
    </> },
    { id: 'environments', title: '3. Account environments: paper and live', body: <>
      <p>The Platform provides two environments. A <strong>paper</strong> environment is provisioned with virtual capital for practice and evaluation; virtual balances have no monetary value, cannot be funded, withdrawn or converted, and are clearly labelled as virtual throughout the interface.</p>
      <p>A <strong>live</strong> environment trades with funds you deposit. Live accounts start with a zero balance and accept orders only once funded and verified. Balances, positions and ledger entries are maintained separately per environment.</p>
    </> },
    { id: 'execution', title: '4. Orders and execution', body: <>
      <p>Orders are submitted through the terminal and processed by the PRIMEVEST matching and settlement engine. Live orders are executed on a principal basis: PRIMEVEST acts as the counterparty to your trades (internal dealing) rather than routing them to an exchange or external liquidity venue. Execution prices are derived from aggregated third-party market data feeds and may differ from prices quoted elsewhere or at other moments.</p>
      <p>All orders are subject to validation, margin and risk checks. Resting orders execute when their conditions are met; short-expiry products settle at expiry according to their published payout terms. We may reject, cancel or close orders and positions where required by risk limits, error correction, legal obligation or these Terms. Every fill is recorded with its provenance in your ledger.</p>
    </> },
    { id: 'deposits', title: '5. Deposits', body: <>
      <p>Funding is accepted in the crypto assets and networks published on the deposits page. Each deposit is credited only to the address displayed for your account and asset, and every deposit enters a manual finance review before it is credited; credit occurs after network confirmation and approval. There is no automatic crediting of funds.</p>
      <p>Do not send assets on unsupported networks, from third-party wallets not under your control, or assets we do not list; such transfers may be irrecoverable. Deposits must originate from sources you own and control. Deposit history, review status and credit entries are visible in your wallet ledger.</p>
    </> },
    { id: 'withdrawals', title: '6. Withdrawals and transfers', body: <>
      <p>Withdrawal requests are reviewed manually and paid to wallets or accounts in your own name, consistent with anti-money-laundering controls. We may apply security holds, request additional verification, or return funds to their origin where required. Applicable fees, if any, are displayed before you confirm a request.</p>
      <p>Transfers between your paper and live environments are not permitted, and virtual balances can never move into the live environment.</p>
    </> },
    { id: 'fees', title: '7. Fees, spreads and charges', body: <>
      <p>Our remuneration consists of spreads, commissions and any funding charges shown at order entry and published in the <a href="/trading-conditions">trading conditions</a>. There are no hidden charges; every debit or credit to your account appears in the ledger with a description. Fee schedules may be updated with notice as described in section 14.</p>
    </> },
    { id: 'market-data', title: '8. Market information', body: <>
      <p>Prices, charts, news and research on the Platform are supplied by third-party providers (including charting and market-data vendors) or derived from them. They are indicative, may be delayed, interrupted or unavailable, and are provided for information only. Nothing on the Platform constitutes investment, tax or legal advice, or an offer or solicitation to trade.</p>
    </> },
    { id: 'prohibited', title: '9. Prohibited conduct', body: <>
      <p>You must not: manipulate prices or abuse quote latency; exploit obvious data errors or mispricings; use the Platform for money laundering, fraud, sanctions evasion or any unlawful purpose; access accounts of others; interfere with, scrape beyond reasonable personal use, or reverse-engineer the Platform; or misrepresent your identity or the source of funds. Breaches may lead to suspension, termination, forfeiture of abusive gains and reporting to authorities.</p>
    </> },
    { id: 'ip', title: '10. Intellectual property', body: <>
      <p>The Platform, its software, design, branding and content are owned by or licensed to PRIMEVEST. You receive a limited, revocable, non-exclusive licence to use them for your personal trading. Third-party names, symbols and logos appear for identification of their respective instruments and remain the property of their owners; their use implies no affiliation or endorsement.</p>
    </> },
    { id: 'availability', title: '11. Availability and support', body: <>
      <p>We target continuous availability but do not guarantee uninterrupted service. Maintenance, incident response and third-party outages may affect access or data. Support is provided through the in-product chat and contact channels; support interactions form part of your account record.</p>
    </> },
    { id: 'liability', title: '12. Limitation of liability', body: <>
      <p>To the maximum extent permitted by law, PRIMEVEST is not liable for indirect, incidental or consequential losses, including loss of profit or opportunity, arising from use of the Platform, market movement, data delays or interruptions, or events beyond our reasonable control. Our aggregate liability for any claim is limited to the fees you paid us in the twelve months preceding the claim. Nothing in these Terms excludes liability that cannot lawfully be excluded, including for fraud or wilful misconduct.</p>
    </> },
    { id: 'termination', title: '13. Suspension, termination and closure', body: <>
      <p>You may close your account at any time by settling open positions and requesting withdrawal of your balance. We may suspend or terminate access, close positions or freeze balances where required by law, by our risk or AML controls, or upon material breach of these Terms. On termination, settled balances remain payable to you subject to the controls in section 6.</p>
    </> },
    { id: 'changes', title: '14. Changes to these Terms', body: <>
      <p>We may update these Terms, the risk disclosure and related policies to reflect changes in law, regulation or the Platform. Material changes are notified through the Platform or by email before they take effect. Continued use after the effective date constitutes acceptance; if you do not accept, you must stop using the Platform and may close your account.</p>
    </> },
    { id: 'law', title: '15. Governing law and disputes', body: <>
      <p>These Terms are governed by the laws of the jurisdiction in which the PRIMEVEST operating entity is established, and disputes are submitted to its competent courts, without prejudice to mandatory consumer protections that apply in your jurisdiction of residence. Before formal proceedings, both parties will attempt in good faith to resolve disputes through our support channel.</p>
    </> },
    { id: 'contact', title: '16. Contact', body: <>
      <p>Questions about these Terms can be raised through the <a href="/contact">contact page</a> or the in-product support chat, which routes to our operations team.</p>
    </> },
  ]} />;
}
