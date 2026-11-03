# PRIMEVEST — Render deployment

This repository is prepared for a Render Blueprint deployment from the GitHub `main` branch.

## Services

The root `render.yaml` defines:

- **primevest-web** — Next.js 15 web service, Frankfurt region, standard instance, one instance initially.
- **primevest-worker** — separate Node background worker for market refresh, paper-order processing, price alerts and risk jobs.
- **primevest-postgres** — isolated Render PostgreSQL database in Frankfurt. Public inbound database access is blocked; the web and worker connect over Render's private network.

The initial instance plans are deliberately conservative. A Render Pro workspace is separate from the compute plan and does not make paid service instances or databases free. Review the Blueprint's resource and billing summary before applying it. Scale the web service, worker and database after checking actual traffic, CPU, memory, latency and database connection metrics.

## First deployment

1. Open the Render Blueprint creation page for this repository:
   `https://dashboard.render.com/blueprint/new?repo=https://github.com/leephil1907-lab/vantabrokerage`
2. Connect the GitHub repository if Render requests access.
3. Review the three resources and their selected plans before applying.
4. Apply the Blueprint. Render generates `SESSION_SECRET`, wires the private PostgreSQL connection into both services, and supplies the web service's external URL as `APP_URL`.
5. The web service runs `prisma migrate deploy` and the safe reference-market seed before starting. The worker waits until the migrated `JobRun` and `TradingPair` tables are available before starting.
6. Configure transactional email separately using the provider documented in [TRANSACTIONAL-EMAIL.md](TRANSACTIONAL-EMAIL.md). Without a configured provider and verified sender, account verification and password-reset email delivery will not work.
7. Verify the web service's `/api/health` endpoint returns HTTP 200 with `{"status":"ok","database":"connected"}`. A 503 indicates the app cannot query its database; inspect Render runtime logs before opening the site to users.

## Runtime configuration

The Blueprint sets:

- `DATABASE_URL` from the private Render Postgres connection string.
- `SESSION_SECRET` as a Render-generated secret.
- `APP_URL` from the web service's Render external URL.
- `EXECUTION_MODE=paper` and `MARKET_DATA_MODE=live`.
- `CRYPTO_DEPOSIT_ADDRESSES={}`.

Do not add database passwords, session secrets, API keys or other credentials to this file or Git. Add optional provider secrets in the Render Dashboard's Environment page.

## Important safety and product boundaries

This is a private staging/demo deployment foundation, not authorization to handle customer funds:

- LIVE order execution remains blocked. There is no live broker/exchange adapter or internal matching engine.
- Customer deposit requests remain disabled; no custody, payment or on-chain deposit verification is connected.
- The worker processes the repository's PAPER/demo flows only.
- Market prices are provider-sourced reference data; modeled spreads/depth are not an executable exchange order book.
- Legal, compliance, security, custody, accounting and live-dealing work remains before any real-money launch.

Do not run the full development seed on Render. The `db:seed-review` mode seeds instrument metadata only; it exits before creating default staff accounts or credentials.
