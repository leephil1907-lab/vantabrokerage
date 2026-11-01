import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "How can we help?" };

export default function Page() {
  return <PublicInfoPage eyebrow={"Support"} title={"How can we help?"} body={"Find account information and access support from your dashboard."} features={[{ title: "Managing your account", body: "Update your profile and review account security settings." }, { title: "Market information", body: "Prices are for reference and may be delayed or unavailable." }, { title: "Contact support", body: "Sign in and open a support request from your dashboard." }]} notice={{ title: "Trading and funding", body: "Order execution and deposits are currently unavailable." }} />;
}
