# Vantage Brokerage — implementation and release plan

Status: active engineering plan for the existing `main` application. This document records verified repository gaps and the implementation order; it does not claim that any unreleased capability is already operational.

## Non-negotiable product decisions

- Preserve the existing Vantage/PRIMEVEST application structure, current branding, authentication, Prisma/PostgreSQL foundation, customer routes, and approved visual direction. Do not replace the application with a template or a collection of copied repositories.
- No wallet-connect flow.
- Keep the dark/light theme switch. Light mode must use readable contrast and distinct surface levels; it must not become an unstructured white page.
- The homepage hero carousel advances automatically, has no visible previous/next/dot/pause controls, and does not pause on hover or keyboard focus.
- Customer-facing language uses familiar terms such as Markets, Orders, Positions, Portfolio, Funds, Transfers and Trade history. Internal implementation terminology stays out of customer-facing copy.
- Do not label paper fills, reference quotes or internal counterparty fills as executions on an external exchange.
- No simulated transaction, balance, deposit, withdrawal or trade outcome may be presented as a real customer transaction.

## Trading model

The intended first architecture is an internal dealing model: Vantage owns the order lifecycle, risk checks, internal execution records and customer accounting. The internal system must distinguish at least:

1. Customer orders that cross with another customer's eligible resting order.
2. Orders accepted against the platform's disclosed dealing/counterparty book, with the platform exposure recorded and controlled.
3. Orders that cannot be executed because price, liquidity, risk capacity or account state is unavailable.

An internal matcher does not create external liquidity. A reference market-data feed is not automatically an executable quote. Before enabling real customer orders, define and test the counterparty model, executable bid/ask construction, spread and slippage policy, position netting, exposure limits, funding, margin, liquidation, dispute handling and reconciliation. Do not simply remove the current live-order guard.

An optional hybrid route can be considered later, after the internal execution ledger and venue-adapter contract are stable. External venue connectivity must be explicit per product and must preserve venue acknowledgements and actual fills as the authoritative execution record.

## Repository findings verified on 1 November 2026

- The application is Next.js 15 / React 19 with Prisma 6 and PostgreSQL.
- The Prisma schema already has users, LIVE/PAPER accounts, wallets, double-entry ledger entries, assets, trading pairs, quotes, orders, positions, executions, notifications and job-run records.
- `src/lib/execution.ts` contains substantial order, position and resting-order logic, but `executionMode()` is hard-coded to `paper` and `assertLiveAllowed()` rejects live operations. The resting-order matcher explicitly skips LIVE accounts.
- `src/components/terminal/live-ticket.tsx` is currently a visual-only ticket; it has no submit handler.
- `src/worker/index.ts` currently refreshes market data only; trading and settlement jobs are paused.
- The repository's deployment-readiness document says live execution, verified deposits, custody/payment rails and production financial controls are not ready.
- The market catalogue schema does not yet represent every desired asset class as a first-class type; in particular, stocks need an explicit product/instrument model decision.
- Light-theme tokens exist, but many components use hard-coded dark-theme utility classes. Theme contrast needs route-by-route verification rather than a superficial global inversion.

## Reference repositories — what to adapt

- `femtotrader/mysql-trade-replicator`: master/subscriber relationships, copy-size scaling and replication event tracking. Future copy-trading module only; do not import its legacy database/terminal implementation.
- `leephil1907-lab/Robinhoodwebs` and `sanko/Robinhood`: order lifecycle vocabulary, order states, quote fields, cancellation and partial-fill concepts. Treat the documented Robinhood API as an unofficial reference, not a dependency.
- `sanko/Finance-Robinhood`: account, position, watchlist, instrument and transfer workflow concepts. Do not import its Perl client or depend on private Robinhood endpoints.
- `leephil1907-lab/alpaca-java`: inspect and validate this repository's actual source before reuse. Keep Alpaca as an optional external integration, not the core internal execution engine.
- `harkhanijenish07-design/BROKERAGE`: selected market-discovery, watchlist, alert, company-information and news UX patterns. Do not transplant its stack or mistake its tutorial application for a complete brokerage.
- `aty13/agentic-trading-kit`: account separation, pre-flight checks, unique order references, circuit breakers, decision records and benchmark reporting. Adapt the controls; do not grant autonomous agents unrestricted customer-account authority.

## Delivery sequence

### Phase 1 — protect and stabilize the current application

- Work on a dedicated implementation branch; keep `main` unchanged until the branch is verified.
- Preserve existing authentication, authorization, account separation and ledger invariants.
- Add/maintain repeatable typecheck, production build, database migration and isolated end-to-end checks.
- Audit every customer-facing route for dead controls, misleading status labels, demo data and inconsistent brand language.
- Verify the deployed database configuration and enabled instrument catalogue before presenting markets as available.

### Phase 2 — finish the customer trading experience

- Connect the order ticket to authenticated server-side order endpoints.
- Support validated market/limit orders, pending orders, cancellation, reduce-only close, stop-loss and take-profit according to instrument capabilities.
- Show order acknowledgements, rejection reasons, partial fills, fills, open positions, realized/unrealized P&L, fees and margin from persisted account records.
- Use idempotency keys for submissions and prevent duplicate processing on retries.
- Make quote source, timestamp, freshness, spread and execution status explicit.
- Ensure every control has a real action or is clearly unavailable with a reason.

### Phase 3 — build internal execution and risk controls

- Design an auditable internal order book and dealing/counterparty book; do not treat the existing paper matcher as live execution.
- Implement atomic order acceptance, reservations, fills, position updates and ledger postings.
- Implement concurrency-safe matching, partial fills, cancel/fill races, order expiry and deterministic replay.
- Add pre-trade balance/margin checks, exposure limits, account/product leverage caps, price bands, stale-price rejection, kill switches and circuit breakers.
- Add mark-to-market, funding, stop triggers, margin calls and liquidation with tested price-source and failure policies.
- Persist immutable execution events with order reference, quote/price provenance, timestamps, fee, counterparty/dealing-book attribution and reconciliation status.
- Keep the live execution guard in place until these controls and the counterparty model pass independent tests.

### Phase 4 — funds, settlement and administration

- Complete double-entry postings and daily reconciliation for every money movement and trading event.
- Implement settlement jobs with durable job state, retries, idempotency and recovery after worker restarts.
- Build staff views for order review, exposure, risk limits, customer restrictions, disputes and audit history.
- Keep deposits and withdrawals disabled until custody/payment integration, verified destination/asset/network/amount/finality checks, approvals and reconciliations are implemented.
- Do not allow manual balance edits to bypass the ledger.

### Phase 5 — market workspace and visual quality

- Improve discovery, watchlists, instrument detail, price alerts, news and market context using verified data sources.
- Add premium cinematic hero media with a poster fallback, responsive delivery, lazy loading and performance budgets. Do not present conceptual artwork as footage of real customers or real trading.
- Verify desktop, tablet and mobile layouts; maintain the selected visual identity and motion language.
- Audit dark and light themes route by route, including forms, tables, menus, charts, dialogs, status chips and empty/error states.
- Preserve accessibility, keyboard operation and reduced-motion behavior.

### Phase 6 — release verification

- Run Prisma validation/generation, migrations against an isolated database, type checks, lint, production build and all relevant tests.
- Add integration tests for duplicate order submissions, partial fills, cancel/fill races, insufficient funds, stale quotes, worker restart, settlement replay, ledger balance and reconciliation.
- Run browser checks across public, authenticated and staff routes at desktop and mobile sizes.
- Verify all secrets are server-only and all customer endpoints enforce ownership and role permissions.
- Record exact passing checks and unresolved failures. A passing build alone is not a live-money readiness sign-off.

## Current branch work

- `src/components/home/hero-carousel.tsx`: changed to continuous automatic rotation, removed visible manual controls, and removed pause-on-hover/focus behavior. Reduced-motion preferences still suppress the transition animation while the slide sequence continues.
- All other work remains pending until implemented and verified. No live execution capability is claimed by this change.


## Neon persistence verification — 1 November 2026

- The connected Neon project named `PRIMEVEST` is present (project ID `blue-firefly-02784990`); its default `production` branch is `ready`.
- The `neondb.public` schema contains the application's core tables, including `User`, `Account`, `Wallet`, `LedgerTransaction`, `LedgerEntry`, `TradingPair`, `MarketQuote`, `Order`, `Execution`, `Position`, `Deposit` and `Withdrawal`.
- The repository's `prisma/schema.prisma`, `src/lib/db.ts`, `.env.example` and `package.json` are identical between `main` and this implementation branch. No existing database connection configuration or Prisma schema change has been replaced by this branch.
- A read-only query found no `public._prisma_migrations` table in the production database. The live schema exists, but migration history is not currently verifiable through Prisma's migration ledger. Do not run `prisma migrate deploy`, `prisma migrate reset`, or a schema push against production until the existing schema has been reconciled with version-controlled migration SQL and a safe baseline strategy is reviewed.
- No production data, schema, credentials or connection strings were modified or exposed during this verification.
- Vercel's configured database environment keys are scoped to Production; Preview does not currently have an isolated database configuration. Configure a separate Neon preview branch and preview-only secrets before relying on Preview deployments for migration or end-to-end testing.
