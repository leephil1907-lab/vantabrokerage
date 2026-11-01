import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Risk disclosure' };

export default function RiskPage() {
  return (
    <LegalPage
      title="Risk disclosure"
      summary="Read this before trading. Leveraged, derivative and short-expiry products can lose money quickly and are unsuitable for most retail investors."
      breadcrumb="Risk disclosure"
      updated="31 October 2026"
      sections={[
        { id: 'leverage', title: 'Leverage risk', body: (
          <p>Leverage multiplies exposure relative to the margin you post. A small adverse move can eliminate your margin and trigger liquidation. Liquidation can close positions at an unfavorable price.</p>
        ) },
        { id: 'market', title: 'Market risk and gaps', body: (
          <p>Prices can gap during news releases, market opens, low-liquidity periods and over weekends. Stop orders are not guaranteed to execute at the requested level, and slippage may exceed your expected loss.</p>
        ) },
        { id: 'short-expiry', title: 'Short-expiry contract risk', body: (
          <p>Short-expiry CALL/PUT contracts are binary in outcome within a fixed window. A losing contract forfeits the entire stake. Repeated losses compound quickly at short expiries.</p>
        ) },
        { id: 'derivatives', title: 'Derivatives risk', body: (
          <p>Perpetual futures accrue funding and can be liquidated. Cross-margin positions share account equity, so losses on one position can affect the margin available for others.</p>
        ) },
        { id: 'technology', title: 'Technology and provider risk', body: (
          <p>Market data depends on third-party providers. Quotes can be delayed or unavailable if a provider is unreachable. Connectivity failures, latency and execution delays can affect results and are not always within our control.</p>
        ) },
        { id: 'suitability', title: 'Suitability', body: (
          <p>You should not trade these products with money you cannot afford to lose, or if you do not fully understand the mechanics — including margin, liquidation, funding and expiry. Seek independent advice if you are unsure.</p>
        ) },
      ]}
    />
  );
}
