import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "Explore crypto markets" };

export default function Page() {
  return <PublicInfoPage eyebrow={"Digital assets"} title={"Explore crypto markets"} body={"Follow digital assets with live prices and market information."} features={[{ title: "Digital assets", body: "Explore market information for Bitcoin, Ethereum and other assets." }, { title: "Price sources", body: "Live USD prices and asset icons sourced from CoinGecko." }, { title: "Volatility", body: "Digital asset prices can move quickly in both directions." }]} market="SPOT" />;
}
