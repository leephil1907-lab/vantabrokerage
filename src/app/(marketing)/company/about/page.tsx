import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "A considered view of the markets" };

export default function Page() {
  return <PublicInfoPage eyebrow={"About PRIMEVEST"} title={"A considered view of the markets"} body={"PRIMEVEST brings market information and account tools together in a focused digital workspace."} features={[{ title: "Market information", body: "Explore provider-sourced currency and digital asset reference prices." }, { title: "A focused workspace", body: "Find charts, market lists and account information in a single interface." }, { title: "Clear information", body: "Understand the risks and distinguish reference prices from executable quotes." }]} />;
}
