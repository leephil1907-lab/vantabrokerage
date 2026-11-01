# Trading execution status and PostgreSQL operations

## Current execution status

**Trading execution is disabled for every account type.** The previous internal PAPER execution workflow is not currently available. New registrations create one empty LIVE account; no PAPER account or simulated starting balance is provisioned.

- Order placement and position-close requests are rejected server-side.
- Short-expiry contracts are blocked.
- The current worker refreshes market reference data only. It does not match resting orders, protect or liquidate positions, settle short-expiry contracts or charge futures funding.
- Historical PAPER accounts, balances, orders, executions, positions and ledger records are preserved. They are not reclassified, transferred, deleted or exposed through normal account selection.
- Customer deposits remain unavailable. Customer-facing deposit addresses are withheld, and withdrawals are not an automated custody/payment service.
- Provider-sourced quotes are reference data, not executable venue liquidity or a broker fill.

Do not re-enable legacy paper execution by restoring an environment variable. The current safeguards are code-level. Deployments with an independently running older worker must stop or upgrade that worker; updating the website alone cannot stop a separate process.

## PostgreSQL connection strategy

The Prisma schema uses PostgreSQL. For managed providers that support pooling, configure:

- `DATABASE_URL`: pooled connection URL for application runtime traffic.
- `DIRECT_URL`: direct, non-pooled URL for Prisma migrations and administrative schema operations.

For local development, both may point to the same local PostgreSQL database. Use provider-issued TLS URLs and never commit credentials. Provision separate databases for review and production, run `npx prisma migrate deploy` as a deliberate release step, and never run the development seed against customer data.

A managed database should provide automated backups and point-in-time recovery. Verify restore procedures, connection limits, pooling behavior, migration recovery, monitoring and alerting before launch.

## Market-only review setup

The `db:seed-review` command uses the review-only path in `prisma/seed.ts`. It inserts static instrument and asset definitions only; it does not create staff accounts, users, balances, orders, deposits, price records or sample trading history. It does not enable order execution. Run it only against a verified isolated review database after migrations and backup checks.

## Verification checklist

1. Confirm the target database is disposable and separate from production/customer data.
2. Configure `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET` and `APP_URL`.
3. Run `npm ci`, `npx prisma generate`, `npx prisma migrate deploy` and `npm run build`.
4. Optionally run `npm run db:seed-review` against the isolated review database to populate market reference definitions.
5. Start the Next.js application and the current market-refresh worker only.
6. Run `npm test` only against the exact disposable local database/server required by `scripts/test-account-safety.ts`.
7. Verify order requests fail closed, deposits remain unavailable, historical PAPER records are preserved, and the worker does not mutate historical trading records.

No environment flag by itself creates a live execution provider, custody integration or payment rail.
