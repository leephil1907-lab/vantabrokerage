import { PageHero, Prose } from '@/components/marketing-ui';
export const metadata = { title: 'Risk disclosure' };
export default function RiskPage() {
  return (<><PageHero eyebrow="Legal" title="Risk disclosure" body="Read this before trading. Leveraged and derivative products can lose more than you expect." />
    <Prose>
      <h2>Leverage risk</h2>
      <p>Leverage multiplies exposure relative to your margin. A small adverse move can eliminate your margin and trigger liquidation. Liquidation closes positions automatically at a price determined by the risk engine.</p>
      <h2>Market risk</h2>
      <p>Prices can gap during news, market opens, low-liquidity periods and weekends. Stop orders are not guaranteed to execute at the requested price.</p>
      <h2>Short-expiry risk</h2>
      <p>Short-expiry CALL/PUT contracts are binary in outcome within a fixed window. A losing contract forfeits the entire stake. These products are unsuitable for most retail investors.</p>
      <h2>Derivatives risk</h2>
      <p>Perpetual futures carry funding costs, liquidation risk and basis risk. Isolated margin limits loss to the position margin; cross margin exposes the whole balance.</p>
      <h2>Technology and provider risk</h2>
      <p>Market-data outages, execution-provider failures and network congestion can delay or prevent order handling. The platform reports connectivity state in the interface rather than masking failures.</p>
      <h2>Paper trading</h2>
      <p>Paper trading uses simulated balances and simulated settlement. Results under simulated conditions are not indicative of live results, which include latency, slippage and fees.</p>
      <h2>No advice</h2>
      <p>Nothing on this platform constitutes investment advice. You are solely responsible for your decisions. Trade only with capital you can afford to lose entirely.</p>
    </Prose></>);
}
