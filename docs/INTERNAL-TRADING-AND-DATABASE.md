# Internal trading session and PostgreSQL operations

## Internal execution scope

PRIMEVEST's initial trading model is an internally operated paper-trading engine. The terminal submits orders to the authenticated server API; the server obtains the market quote, validates the account and instrument, reserves funds, records the order and execution, and the background worker handles resting orders, protective exits, funding and liquidations.

- Internal orders are enabled only for the PAPER account. The LIVE account remains isolated and order entry is rejected until a separately reviewed live execution and funds architecture exists.
- Prices are sourced from the configured market-data providers. Some asset-class spreads are modeled; these quotes are not a consolidated exchange order book, executable external liquidity, or a broker fill.
- Paper balances are test balances. They are not deposits, redeemable customer funds, or evidence of custody.
- The order ticket is wired to the existing server-side order API and execution service. The Fills tab displays recorded internal executions.
- The worker must run as a supervised, single instance until worker concurrency and idempotency have been independently validated.

## PostgreSQL connection strategy

The Prisma schema uses PostgreSQL. For a managed provider that supports connection pooling, configure:

- `DATABASE_URL`: the provider's pooled connection URL for application runtime traffic.
- `DIRECT_URL`: the provider's direct, non-pooled connection URL for Prisma migrations and administrative schema operations.

For local development, both values may point to the same local PostgreSQL database. Use provider-issued URLs and TLS parameters; do not commit credentials. Provision a separate database for staging and production, run `npx prisma migrate deploy` as a release step, and never run the development seed against a production database.

A managed database should provide automated backups and point-in-time recovery on the selected plan. Before launch, verify restore procedures, connection limits, pooling behavior, migration rollback/recovery, monitoring, and alerting against the chosen provider. The repository does not create a hosted database project or provision credentials automatically.

## Deployment checklist

1. Set `ENABLE_PAPER_TRADING=true` in the protected environment for the paper session.
2. Configure `DATABASE_URL` and `DIRECT_URL` for the same isolated PostgreSQL environment.
3. Run `npm ci`, `npx prisma generate`, `npx prisma migrate deploy`, and `npm run build`.
4. Start the Next.js web process and the separate `npm run worker` process.
5. Test registration, email verification, account creation, market quote freshness, market and resting orders, cancel/replace behavior, position close, take-profit/stop-loss, margin warning, liquidation, ledger balancing, and account isolation using disposable test accounts.
6. Verify that LIVE-account order attempts are rejected and deposits remain unavailable. Do not accept customer money or present paper fills as live broker execution.

## Not included in this phase

This internal paper engine does not provide external broker routing, exchange membership, custody, on-chain deposit verification, payment processing, or automated withdrawals. Those are separate integrations and must not be enabled by setting an environment variable alone.
