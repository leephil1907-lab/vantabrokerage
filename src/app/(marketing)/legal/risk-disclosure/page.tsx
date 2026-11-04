import { LegalPage } from '@/components/legal-page';

export const metadata = { title: 'Risk disclosure' };

export default function RiskDisclosurePage() {
  return <LegalPage title="Risk disclosure" summary="The specific risks of leveraged products, crypto assets and short-expiry contracts traded on PRIMEVEST. Read before funding a live account." breadcrumb="Risk disclosure" updated="4 November 2026" version="2.0" sections={[
    { id: 'general', title: '1. General', body: <>
      <p>Trading foreign exchange, contracts for difference, crypto assets and short-expiry products carries a high level of risk and can result in the loss of your entire capital. These products are not suitable for every investor. You should trade only with capital you can afford to lose and never with borrowed funds or money reserved for essential commitments.</p>
    </> },
    { id: 'leverage', title: '2. Leverage and margin', body: <>
      <p>Leverage multiplies both gains and losses: a small adverse move in the underlying can exhaust your margin and close positions at a loss exceeding the amount initially committed. Margin requirements are enforced automatically, and positions may be liquidated without further notice when available margin is insufficient.</p>
    </> },
    { id: 'volatility', title: '3. Market and volatility risk', body: <>
      <p>Prices can move rapidly and discontinuously, particularly around economic releases, market opens and, for crypto assets, at any hour of any day. Gaps and fast markets can cause executions at prices materially different from the price you saw when submitting an order (slippage), and stop levels do not guarantee a limit on loss.</p>
    </> },
    { id: 'short-expiry', title: '4. Short-expiry products', body: <>
      <p>Short-expiry contracts settle at a fixed time against a reference price. If the contract expires out of the money, the amount committed to it is lost in full; there is no opportunity to recover it by holding longer. Payout rates are fixed at entry and reflect the probability-weighted nature of these products. Only commit amounts you are prepared to lose entirely.</p>
    </> },
    { id: 'crypto', title: '5. Crypto-asset specific risk', body: <>
      <p>Crypto assets are volatile, trade continuously and can be affected by protocol failures, network congestion, forks, exchange outages and regulatory change. Deposits sent on unsupported networks or to incorrect addresses may be irrecoverable. On-chain transfers are irreversible by design.</p>
    </> },
    { id: 'liquidity', title: '6. Liquidity and execution risk', body: <>
      <p>In thin or stressed markets, spreads widen and depth disappears; execution may occur at prices away from indicative quotes. Live orders on PRIMEVEST are executed on a principal basis against the internal matching engine, so your execution price depends on the reference feeds and risk controls in force at that moment.</p>
    </> },
    { id: 'operational', title: '7. Operational and technology risk', body: <>
      <p>Systems, networks and third-party data feeds can fail or be interrupted. The Platform displays reconnecting states when a feed is unavailable; such states are not quotes. You remain responsible for monitoring and managing open positions, and should maintain independent records of your activity.</p>
    </> },
    { id: 'counterparty', title: '8. Counterparty risk', body: <>
      <p>Because PRIMEVEST acts as principal to your live trades, you bear counterparty exposure to the firm. Client funds are held separately from operating funds and funding movements are ledger-recorded and manually reviewed, but no arrangement eliminates counterparty risk entirely.</p>
    </> },
    { id: 'no-advice', title: '9. No advice', body: <>
      <p>Nothing on the Platform — including research, indicators, signal panels, news or market briefs — constitutes investment, legal or tax advice, or a recommendation to enter any transaction. You are solely responsible for your decisions. Where in doubt, obtain independent professional advice before trading.</p>
    </> },
    { id: 'acknowledgement', title: '10. Acknowledgement', body: <>
      <p>By funding a live account and submitting orders you confirm that you have read this disclosure and the <a href="/legal/terms">terms and conditions</a>, that you understand the risks described, and that you trade on your own initiative and for your own account.</p>
    </> },
  ]} />;
}
