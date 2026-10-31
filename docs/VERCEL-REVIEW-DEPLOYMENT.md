# Vercel deployment: protected design review

This runbook prepares the current Next.js website for a **private, access-controlled review**, not a public brokerage launch. Vercel deployment itself has not been tested yet. Real-money execution is hard-blocked, the customer deposit endpoint returns 503, no internal matching engine or custody/payment provider is connected, and the displayed external prices are references—not PRIMEVEST executable quotes. Some legacy pages and APIs still include simulated features; this deployment is not a no-simulation production system.

## 1. Prepare infrastructure first

- Create an isolated PostgreSQL database for this review. Never use a customer, existing staging or production database. Ensure network access, TLS, backups and suitable connection pooling for Vercel's serverless instances. Keep preview and production databases and secrets separate. For Prisma 6, configure `DATABASE_URL` as the provider-supported pooled URL for app traffic and `DIRECT_URL` as the direct PostgreSQL URL for migrations.
- Enable deployment protection for **every URL/environment** that will be created, including the initial Production deployment and any custom domain, not just preview URLs. Check whether your Vercel plan supports the protection method you require. If you cannot protect the initial deployment, do not deploy this build. Vercel's first CLI deployment of a new project can be a Production deployment even without `--prod`; Git pushes to the production branch also create Production deployments. Do not assume a URL is private because it is called a preview.
- No real funds, real customer personal information or real API credentials for financial services. No external customer signups. The review database and accounts must be disposable and access-controlled.

## 2. Initialize the database (once, deliberately)

From a trusted machine with Node.js, the repository and the **isolated review database's direct URL** configured as `DIRECT_URL` in its process environment. If no pooler is used, set `DATABASE_URL` to the same direct URL:

```sh
npm ci
npx prisma migrate deploy
npm run db:seed-review
```

The review seed inserts reference instrument and asset definitions only. It creates **no staff accounts, users, balances, orders, deposits, price records or sample trading history**. It uses existing static instrument definitions; the prices shown are subsequently obtained from providers. It is safe to rerun on the same isolated review database, but its upserts may update matching instrument definitions: never point it at a database with customer data without a reviewed migration plan. Only forex and Kraken-mapped crypto spot reference definitions are included. Other instrument categories may remain empty. Provider availability, rights and freshness must be verified; definitions do not imply a market is tradeable.

**Do not run `npm run seed` against a hosted/review deployment.** The development seed includes known staff credentials and simulated settings; the script now refuses its full seed in production or on Vercel. It must never be used with real data. Create your own private review user through the registration page after deployment. That user is not an administrator. Registration still provisions a legacy paper account, so use `PAPER_STARTING_BALANCE=0` for the review; other legacy simulation functionality remains in the code. This variable is not a security or trading-disable switch.

## 3. Import into Vercel

Import the GitHub repository as a new Next.js project; use the repository root. The committed `vercel.json` selects `npm run vercel-build`, which validates required environment variables, generates Prisma Client and builds Next.js. It does **not** run migrations, seeds, a worker or tests. Set the following variables in the Vercel project for each actual environment **before deploying**:

| Variable | Value / purpose |
| --- | --- |
| `DATABASE_URL` | Server-side pooled connection URL for the isolated PostgreSQL database; never a local `127.0.0.1` URL. |
| `DIRECT_URL` | Direct, non-pooled connection URL for Prisma migrations. For a review database without a pooler, this may be the same URL as `DATABASE_URL`. |
| `SESSION_SECRET` | A unique cryptographically random secret, at least 32 characters; e.g. generate locally with `openssl rand -hex 32`. Do not share or commit it. |
| `APP_URL` | The exact stable protected HTTPS origin for that environment, without a path; verification and reset emails use this origin. Do not copy a production URL into Preview. |
| `PAPER_STARTING_BALANCE` | `0` for review; this does not disable legacy simulated actions. |
| `CRYPTO_DEPOSIT_ADDRESSES` | Leave unset or `{}`. Deposits remain unavailable. |
| `COINGECKO_DEMO_API_KEY` | Optional, server-side only; review the provider's plan, usage limits and redistribution rights. |

Optional email: configure `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` and `EMAIL_FROM` for an authorized sender, or a supported email webhook. Without a delivery provider, registration still works, but verification and password-reset emails are not delivered. The outbox retains sensitive links and needs strict access and retention controls. Use only authorized disposable addresses in review.

Do not put secrets in `NEXT_PUBLIC_*` variables. Vercel variables are environment-specific and changes require a redeployment. The build guard checks the format of required values but **cannot** check database reachability, schema state, email delivery, deployment protection or the randomness of the secret.

## 4. Deploy and verify privately

1. Confirm the isolated database has migrations and review definitions, the correct environment variables are set, and all deployment URLs are protected **before** starting the deployment.
2. Deploy from the current `main` branch or a protected preview branch. Verify the build log and inspect runtime logs. The first deployment may be designated Production even for review.
3. In a private browser, check `/`, `/markets`, `/register`, `/dashboard`, `/dashboard/crypto`, `/dashboard/forex` and `/dashboard/deposits`. Register only an authorized disposable review user. Check market freshness and mobile layout. The deposit page must say funding is unavailable; a direct POST to `/api/wallet/deposits` must return 503, and live order APIs must continue to fail closed.
4. Test email verification only if a review email provider and correct `APP_URL` are configured. Monitor errors and upstream rate limits. Do not run data-mutating e2e/seed scripts against any non-disposable database.

## Platform limitations

- This repository's `src/worker/index.ts` is a continuous process and is **not started by the Vercel build or Next.js functions**. The review doesn't require it for the disabled live order ticket; legacy simulated limit/short-expiry/funding jobs will not run. A future live matching/settlement engine requires a separately designed durable service, recovery, concurrency protection, monitoring and audit—not a function loop.
- CoinGecko discovery uses per-process in-memory caching and polling, not a shared global cache. On Vercel, cold starts and multiple instances can increase provider calls and exhaust rate limits. Feed staleness and outages must remain visible. Database pooling and function durations also need load testing.
- Live WebSockets, if added later, need an appropriate Vercel integration, reconnect logic and external shared state. Vercel documents that connections end at the function's maximum duration: https://vercel.com/docs/functions/websockets.
- Independent security, financial-control, market-data rights and jurisdiction-specific legal reviews are still required. A successful Vercel build is **not** authorization or evidence of readiness to take funds.

References: https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel and https://vercel.com/docs/projects/deploy-from-cli.

## Local verification of this preparation

On 31 October 2026, the Vercel build command completed locally with format-valid placeholder environment values (no hosted database connection was implied). On a separate disposable PostgreSQL database, all migrations and two consecutive market-only seed runs succeeded; the initial database contained 16 reference definitions and zero users, orders, deposits or quote records. A local server using that database and a zero paper starting balance passed registration, dashboard, live-order fail-closed and deposit fail-closed checks. The normal isolated e2e suite passed 130 checks; authenticated desktop/mobile route checks and CoinGecko discovery checks also passed. No actual Vercel deployment, deployment protection, external database connection or email delivery has been verified.
