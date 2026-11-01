import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "Understanding short-expiry products" };

export default function Page() {
  return <PublicInfoPage eyebrow={"Market education"} title={"Understanding short-expiry products"} body={"Learn about products that depend on price movements over short time periods."} features={[{ title: "Time horizons", body: "Short-expiry products use a defined period to determine a result." }, { title: "Market prices", body: "The market price, timing and contract terms all matter." }, { title: "Settlement", body: "Each contract settles automatically at the end of its time period." }]} market="BINARY" />;
}
