# Live-trading provider options

Research date: 31 October 2026. This is a preliminary technical shortlist, not a licensing or legal opinion. The intended launch countries, legal entity and execution/custody model are not yet specified. No provider has been selected or connected. Live execution in this repository remains disabled.

## Proposed initial architecture

For the first launch, evaluate a **customer-connected account model**: each eligible customer opens and funds their own account directly with an authorized forex broker and/or crypto exchange; PRIMEVEST acts as an interface to accounts that have explicitly authorized it. This avoids presenting the existing simulated wallet as a source of real money. It does **not** automatically eliminate licensing, registration, privacy, API security or provider partnership obligations. Confirm those obligations and obtain provider permission before deployment.

A company-operated brokerage/custody model is a different, larger project: regulated customer onboarding, custody, client-money segregation, payment rails, reconciliations, audit and operational controls must be designed and authorized for each applicable jurisdiction. Neither model is ready in the current repository.

## Provider shortlist

| Use | Candidate | What its official documentation supports | Key qualification |
|---|---|---|---|
| Forex | [OANDA v20](https://developer.oanda.com/rest-live-v20/introduction/) | Account price streaming, order management and position/account APIs. | Requires an eligible v20 account. OANDA says v20 is not available in all divisions; confirm partner permissions, instrument availability and each customer's jurisdiction directly. |
| Crypto spot | [Kraken Spot WebSocket v2](https://docs.kraken.com/exchange/api-reference/spot-websocket) | Live ticker, trades, order book and authenticated order/account channels; order-book checksums. | Confirm customer eligibility, products, commercial API usage/redistribution terms and account-connection model in each target country. |
| Crypto alternative | [Coinbase Advanced Trade](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/overview) | REST order management and WebSocket market/user streams. | Eligibility and availability depend on the specific product and country. Institutional and individual offerings differ. |

**Working recommendation for a first technical evaluation:** Kraken for crypto spot and OANDA v20 for forex, with Coinbase as a crypto alternative. This is not a statement that either will onboard users in a specific country or permit this business model. Obtain written confirmation and review costs, limits, instruments, data redistribution rights and regulatory permissions before integrating customer execution. Futures and short-expiry products require separate provider, legal and eligibility decisions; do not assume spot permissions cover them.

## What “live market price” means

- A price must identify the actual venue, instrument, quote currency, bid/ask/last and provider timestamp. Different exchanges and forex brokers can legitimately quote different prices; USD and USDT pairs are not interchangeable.
- Stream the venue’s own market data; detect stale feeds, disconnected connections, missing sequence updates and book integrity failures. Mark quotes unavailable and block new orders when safe pricing cannot be confirmed.
- CoinGecko's aggregated prices and icons can support **read-only discovery** but must never be presented as an executable venue quote or used to fabricate a fill.
- A displayed quote is not a guaranteed execution price. The venue's order acknowledgement and actual fill(s), not a locally simulated fill, are authoritative. Slippage, liquidity, rejected orders and network delay are real.
- OANDA specifically says its [pricing stream](https://developer.oanda.com/rest-live-v20/pricing-ep/) provides at most four prices per second per instrument and does not send every price. A promise of exact matching at every instant would therefore be misleading.

## Work required before live orders

1. Confirm target countries, product scope, providers, customer-account versus company-custody model, and provider approvals.
2. Implement venue-specific adapters for public market data and authenticated account/order streams; store secrets in a managed secret store with minimum permissions, never in browser code or chat.
3. Build order acknowledgements, rejections, partial fills, cancellations, idempotency, durable reconciliation, kill switches, reconnection and market-data freshness controls. Only a provider-confirmed fill may be marked filled.
4. Replace demo account/wallet flows with the selected real account and custody model, and remove or explicitly disable unsupported products and simulated features. Never move simulated funds into real accounts.
5. Obtain independent security, financial-control and legal/compliance reviews, including jurisdiction-specific permissions, KYC/AML/sanctions and data protection. Nigeria's [Investment and Securities Act 2025](https://sec.gov.ng/documents/1326/INVESTMENT-AND-SECURITIES-ACT-NIGERIA-2025_1.pdf) includes provisions on online forex and virtual-asset oversight; obtain Nigerian legal advice if Nigeria is in scope. Check every other intended country separately.
6. Validate on isolated provider test facilities and then conduct a controlled, authorized operational rollout before accepting customer orders. Testing does not authorize real-money launch or guarantee perfect execution.
