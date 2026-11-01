import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "Explore the currency markets" };

export default function Page() {
  return <PublicInfoPage eyebrow={"Forex"} title={"Explore the currency markets"} body={"Follow major currency pairs, review indicative prices and explore market movements."} features={[{ title: "Currency pairs", body: "A currency pair represents the value of one currency relative to another." }, { title: "Reference prices", body: "Displayed quotes depend on data availability and can differ across providers." }, { title: "Market risk", body: "Currency values move with economic events and market conditions. Leverage increases risk." }]} market="FOREX" />;
}
