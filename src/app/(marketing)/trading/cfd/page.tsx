import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "Indices and commodities" };

export default function Page() {
  return <PublicInfoPage eyebrow={"Markets"} title={"Indices and commodities"} body={"Explore information about global indices and commodities alongside currency markets."} features={[{ title: "Indices", body: "An index measures a group of underlying assets or a segment of a market." }, { title: "Commodities", body: "Commodity prices are influenced by supply, demand and global events." }, { title: "CFD risk", body: "Contracts for difference are complex products and leverage can magnify losses." }]} />;
}
