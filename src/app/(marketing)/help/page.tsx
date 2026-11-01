import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "How can we help?" };

export default function Page() {
  return <PublicInfoPage eyebrow={"Support"} title={"How can we help?"} body={"Find account information and access support from your dashboard."} features={[{ title: "Managing your account", body: "Update your profile and review account security settings." }, { title: "Market information", body: "Live prices and market information from third-party providers." }, { title: "Contact support", body: "Sign in and open a support request from your dashboard." }]} notice={{ title: "Trading and funding", body: "Trading is available from your terminal. Funding options are coming soon." }} />;
}
