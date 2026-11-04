import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'AML policy' };

export default function AmlPage() {
  return <LegalPage title="Anti-money-laundering policy" summary="How PRIMEVEST prevents financial crime: customer due diligence, sanctions screening, transaction monitoring, crypto-asset controls and reporting." breadcrumb="AML policy" updated="4 November 2026" version="2.0" sections={[
    { id: 'purpose', title: '1. Purpose and scope', body: <>
      <p>This policy sets out the controls PRIMEVEST applies to prevent money laundering, terrorist financing, sanctions evasion and fraud across the Platform. It applies to every customer relationship, account environment and funding movement, and is enforced by our compliance function with senior management ownership.</p>
    </> },
    { id: 'kyc', title: '2. Customer due diligence', body: <>
      <p>Every customer is identified and verified before live trading or funding: legal name, date of birth, country of residence and government-issued identification, with address evidence where required. Verification decisions are made manually by compliance staff. Enhanced due diligence applies to politically exposed persons, higher-risk jurisdictions, complex ownership structures and unusual patterns of activity.</p>
    </> },
    { id: 'sanctions', title: '3. Sanctions and geographic controls', body: <>
      <p>Customers, wallets and transactions are screened against applicable sanctions and watchlists at onboarding and on an ongoing basis. We do not serve persons or entities subject to restrictive measures, or jurisdictions where providing the service would breach applicable law. Screening hits block activity pending compliance review.</p>
    </> },
    { id: 'monitoring', title: '4. Transaction monitoring', body: <>
      <p>All deposits, withdrawals, transfers and trading activity are monitored for patterns indicative of financial crime, including structuring, rapid pass-through of funds, use of unrelated third-party wallets and activity inconsistent with a customer&rsquo;s stated profile. Alerts are investigated by compliance and may result in requests for information, holds, or account closure.</p>
    </> },
    { id: 'sof', title: '5. Source of funds and wealth', body: <>
      <p>Where risk assessment requires, we ask customers to evidence the source of funds used to finance the account and, for enhanced cases, the source of wealth. Failure to provide satisfactory evidence results in refusal or termination of the relationship and return of funds consistent with section 6.</p>
    </> },
    { id: 'crypto', title: '6. Crypto-asset controls', body: <>
      <p>Deposits are accepted only from wallets under the customer&rsquo;s own control and are credited after manual finance review; incoming addresses are screened against known illicit-activity datasets. Withdrawals are paid to wallets in the customer&rsquo;s own name, favouring return to the origin of funds. Transfers linked to mixers, tumblers or sanctioned entities are refused. Complete transaction records, including addresses and hashes, are maintained for every movement.</p>
    </> },
    { id: 'reporting', title: '7. Reporting and no tipping-off', body: <>
      <p>Suspicious activity is reported to the competent authorities in the form and timeframes required by applicable law. Customers and third parties are not informed that a report has been made or that an investigation is underway, except where disclosure is permitted by law.</p>
    </> },
    { id: 'records', title: '8. Records, training and review', body: <>
      <p>Identification records, transaction records and monitoring outcomes are retained for at least five years after the relationship ends, or longer where required. Staff receive role-appropriate AML training, and the programme is independently reviewed and updated as risks, law and typologies evolve.</p>
    </> },
    { id: 'cooperation', title: '9. Customer cooperation', body: <>
      <p>Customers must provide accurate information, keep it current, and cooperate with verification and monitoring requests. Misrepresentation, use of third-party funds or wallets, or attempts to circumvent controls result in termination, forfeiture of abusive gains where applicable, and reporting to authorities.</p>
    </> },
  ]} />;
}
