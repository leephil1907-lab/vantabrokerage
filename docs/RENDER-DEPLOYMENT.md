# PRIMEVEST — Render deployment

PRIMEVEST is deployed from the GitHub main branch on Render. Vercel is not part of the deployment path.

## Existing infrastructure

The Render workspace already contains this PostgreSQL resource:

- **Resource:** Primevest
- **Database:** primevest_postgres
- **Database user:** primevest_postgres_user
- **Region:** Frankfurt
- **Plan:** Basic 1 GB
- **Status:** Available
- **Dashboard:** https://dashboard.render.com/d/dpg-dbl5n4t9fdbs739k8ckg-a

The Blueprint references this existing database by its exact Render resource name and database/user identifiers. Review the Blueprint resource summary carefully before applying it; do not create a second database.

## Services

The root render.yaml defines:
- **primevest-web** — Next.js web application, Frankfurt, Standard instance.
- **primevest-worker** — persistent Node background worker, Frankfurt, Starter instance.
- **Primevest** — the existing PostgreSQL database above.

The web service and worker use the database's private connection string over Render's private network. Public database access remains disabled. A Render Pro workspace is separate from compute plans and does not make paid instances or databases free. Review the resource and billing summary before applying the Blueprint.

## Deployment steps

1. Open the Render Blueprint page: https://dashboard.render.com/blueprint/new?repo=https://github.com/leephil1907-lab/vantabrokerage
2. Connect the GitHub repository if requested.
3. Confirm Render is reusing the existing Primevest database. If the dashboard proposes a new database, stop and reconcile the Blueprint rather than applying a duplicate.
4. Review the web and worker plans and estimated charges.
5. Apply the Blueprint to create the web service and background worker.
6. Render builds the main branch. The web service runs Prisma migrations and the safe reference-market/funding configuration seed before starting. The worker waits for migrated database tables before starting.
7. Configure transactional email in Render Environment settings. See TRANSACTIONAL-EMAIL.md.
8. Verify /api/health returns HTTP 200 with {"status":"ok","database":"connected"}. A 503 means the app cannot query its database; inspect Render logs before opening the site to users.

## Runtime configuration

The Blueprint supplies DATABASE_URL from the existing private Render PostgreSQL connection string, a generated SESSION_SECRET, APP_URL from the web service's Render external URL, EXECUTION_MODE=paper and MARKET_DATA_MODE=live.

The database seed initializes the shared deposit-address book once. Admin edits are preserved on later deploys. Do not put database passwords, session secrets, API keys or other credentials in Git. Add optional provider secrets in Render Environment settings.

## Product boundaries

- Crypto deposit requests are recorded as pending manual finance review. A submitted transaction hash is not proof of payment; finance must independently verify asset, network, destination, amount and finality before approving and crediting.
- LIVE order execution remains blocked. There is no live broker/exchange adapter or internal matching engine.
- Market prices are provider-sourced reference data; modeled spreads/depth are not an executable exchange order book.
- The worker processes configured background jobs. It does not create live exchange execution or independently verify deposits.
- Complete security, compliance, custody, accounting and operational reviews before handling customer funds at scale.

Do not run the full development seed on Render. The db:seed-review mode seeds reference markets and the initial funding address book only; it exits before creating default staff accounts or credentials.
