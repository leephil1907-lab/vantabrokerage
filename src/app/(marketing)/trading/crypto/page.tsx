import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "Explore crypto markets" };

export default function Page() {
  return <PublicInfoPage eyebrow={"Digital assets"} title={"Explore crypto markets"} body={"Follow digital assets with reference prices and market information."} features={[{ title: "Digital assets", body: "Explore market information for Bitcoin, Ethereum and other assets." }, { title: "Price sources", body: "Reference prices vary across venues and do not guarantee an executable price." }, { title: "Volatility", body: "Digital assets can change value rapidly and involve substantial risk." }]} market="SPOT" />;
}
