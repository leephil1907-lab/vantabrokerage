import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "Explore the currency markets" };

export default function Page() {
  return <PublicInfoPage eyebrow={"Forex"} title={"Explore the currency markets"} body={"Follow major currency pairs, review live prices and explore market movements."} features={[{ title: "Currency pairs", body: "A currency pair represents the value of one currency relative to another." }, { title: "Live prices", body: "Displayed quotes stream from third-party market data providers." }, { title: "Market risk", body: "Currency values move with economic events and market conditions." }]} market="FOREX" />;
}
