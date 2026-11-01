import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "Deposits and withdrawals" };

export default function Page() {
  return <PublicInfoPage eyebrow={"Funding"} title={"Deposits and withdrawals"} body={"Review your account balance and activity in your dashboard."} features={[{ title: "Balances", body: "Your account dashboard shows available and reserved balances." }, { title: "Account activity", body: "Review your transaction history in the wallet section." }, { title: "Security", body: "Keep your account credentials secure and review activity regularly." }]} notice={{ title: "Funding availability", body: "Funding options are coming soon. Your balances and activity are visible in the dashboard at all times." }} />;
}
