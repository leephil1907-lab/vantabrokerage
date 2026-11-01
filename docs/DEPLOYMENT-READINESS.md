# PRIMEVEST — deployment readiness

Updated 1 November 2026 after the account-transition and execution-safeguard change. This is a repository-level technical assessment, not an independent security audit or legal opinion.

## Decision

**Suitable only for a private, isolated product and market-information review. Not ready for public brokerage operations, customer funds or trading.** The current application blocks order execution for every account type, creates one empty LIVE account for new registrations, disables customer deposits and does not automate withdrawals. Historical PAPER records remain stored but are not exposed through normal account selection or processed by the current worker.

## Current implementation state

- Market pages display third-party reference prices where configured instruments and providers are available. Prices may be delayed or unavailable and are not executable quotes, exchange liquidity or a PRIMEVEST order book.
- All new order placement, position-close and short-expiry execution attempts are blocked server-side. The current worker refreshes market data only; it does not match resting orders, revalue or liquidate positions, settle short-expiry contracts or charge funding.
- New users receive one empty LIVE account. Historical PAPER accounts, balances, orders and ledger records are preserved, not converted, deleted or exposed as active accounts.
- Customer deposit requests remain disabled. Customer-facing deposit addresses are withheld; no payment rail, custody integration or independent blockchain verification is connected. Historical finance records may remain in the database.
- Email supports configured Resend or webhook delivery. Delivery must be verified with an authorized controlled mailbox; provider acceptance is not proof of inbox delivery.
- Legal and commercial pages are product information, not approved legal documents. Entity, licensing, permitted jurisdictions, product restrictions and disclosures require qualified review.

## Private review prerequisites

1. Use an access-controlled environment and a separate disposable PostgreSQL database. Do not use customer information, customer funds or production credentials.
2. Configure TLS, a unique high-entropy `SESSION_SECRET`, exact HTTPS `APP_URL`, pooled runtime `DATABASE_URL` and direct migration `DIRECT_URL`.
3. Run `npm ci`, `npx prisma generate`, `npx prisma migrate deploy` and `npm run build`. If market reference definitions are required, run `npm run db:seed-review` only against the isolated review database after verifying its identity and backup. This seed creates instrument and asset definitions only; it does not create tradeable execution venues or sample trading activity.
4. Run `npm test` only with the disposable local database and server specified by `scripts/test-account-safety.ts`. Run browser and public-copy checks only against the explicitly isolated review server.
5. Confirm no old separately supervised worker is still running. An older worker can continue matching or settling historical records even if the web application has been updated; stop or replace it before review.
6. Monitor market-provider availability, email failures, application errors and database health. Test backup restoration and recovery.

## Blocking work before any brokerage launch

- Select and integrate authorized execution venues or a reviewed internal execution model; implement order routing/matching, acknowledgements, partial fills, rejections, cancellations, idempotency, reconciliation, safe recovery and independently tested risk controls.
- Integrate authorized custody and payment rails, verified deposits, reconciliations, withdrawal authorization, segregated funds and operational controls.
- Complete independent security, privacy, financial-control and penetration reviews.
- Obtain jurisdiction-specific legal and compliance review for licensing, AML/KYC/sanctions, suitability, risk disclosures, market-data rights and product restrictions.
- Establish production monitoring, incident response, backup restoration, release sign-off and rollback procedures.

## Verification status

The GitHub Actions build workflow has previously completed successfully for the initial synchronization commit. The latest follow-up commit has its own build run; its final result must be checked before treating the current branch as verified. No production deployment, production database migration, customer email or live financial transaction was performed as part of this update.
