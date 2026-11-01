import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "A considered view of the markets" };

export default function Page() {
  return <PublicInfoPage eyebrow={"About PRIMEVEST"} title={"A considered view of the markets"} body={"PRIMEVEST brings market information and account tools together in a focused digital workspace."} features={[{ title: "Market information", body: "Explore live currency and digital asset prices." }, { title: "A focused workspace", body: "Find charts, market lists and account information in a single interface." }, { title: "Clear information", body: "Market data, sessions and account tools presented clearly in one place." }]} />;
}
