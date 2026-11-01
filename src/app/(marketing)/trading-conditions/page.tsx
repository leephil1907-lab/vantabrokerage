import { PublicInfoPage } from '@/components/public-info-page';

export const metadata = { title: "Trading conditions" };

export default function Page() {
  return <PublicInfoPage eyebrow={"Information"} title={"Trading conditions"} body={"Review the principles that affect pricing and risk across financial markets."} features={[{ title: "Pricing", body: "Quotes and spreads can differ by market and provider." }, { title: "Costs", body: "Fees and contract terms should be reviewed before any transaction." }, { title: "Risk", body: "Market volatility, liquidity and leverage can affect outcomes." }]} notice={{ title: "Order execution", body: "Trading is currently unavailable. No executable quote or fee schedule is being offered." }} />;
}
