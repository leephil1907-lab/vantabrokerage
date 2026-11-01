import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "Understanding futures" };

export default function Page() {
  return <PublicInfoPage eyebrow={"Market education"} title={"Understanding futures"} body={"Learn about futures and the market factors that influence their prices."} features={[{ title: "Futures contracts", body: "Futures are agreements tied to an underlying market and contract terms." }, { title: "Perpetuals", body: "Perpetual contracts do not have a fixed expiry and may have funding payments." }, { title: "Risk", body: "Leverage can magnify losses; contract terms vary by venue." }]} market="FUTURES" />;
}
