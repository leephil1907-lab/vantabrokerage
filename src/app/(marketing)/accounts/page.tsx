import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "Your PRIMEVEST account" };

export default function Page() {
  return <PublicInfoPage eyebrow={"Accounts"} title={"Your PRIMEVEST account"} body={"A single account for your profile, account settings and market workspace."} features={[{ title: "Your profile", body: "Manage your personal details and account preferences." }, { title: "Account security", body: "Review sessions and use the available security settings to protect your account." }, { title: "Your dashboard", body: "View account information, markets and support in one place." }]} />;
}
