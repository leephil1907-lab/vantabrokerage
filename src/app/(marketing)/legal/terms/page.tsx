import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Terms and conditions' };

export default function TermsPage() {
  return <LegalPage title="Terms and conditions" summary="Information about access to PRIMEVEST and use of its market information." breadcrumb="Terms" updated="1 November 2026" sections={[
    { id: 'account', title: 'Your account', body: <p>Provide accurate registration information, keep your credentials secure and report suspected unauthorized access. You are responsible for safeguarding access to your account.</p> },
    { id: 'market-data', title: 'Market information', body: <p>Market prices are supplied by third parties, are indicative and may be delayed or unavailable. Reference prices are not executable quotes or investment advice.</p> },
    { id: 'availability', title: 'Trading and funding', body: <p>Order execution and deposits are currently unavailable. Do not send funds or cryptocurrency. Account registration does not create an entitlement to execution, custody or payment services.</p> },
    { id: 'risk', title: 'Risk', body: <p>Foreign exchange, crypto assets and derivatives can involve substantial loss. See the <a href="/legal/risk-disclosure">risk disclosure</a> and consider independent advice.</p> },
    { id: 'third-party', title: 'Third-party information', body: <p>Third-party names and logos are used for identification and do not imply affiliation or endorsement.</p> },
  ]} />;
}
