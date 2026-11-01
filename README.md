# PRIMEVEST

Next.js multi-market trading workspace with an internal PAPER execution session.

## Current scope

The internal matching workflow is available only for PAPER accounts and uses provider-sourced reference quotes. It is not a public exchange order book, does not route to an external broker, and does not represent external liquidity. LIVE-account order entry, customer deposits and automated withdrawals remain unavailable. The application is **not ready for public real-money trading or customer funds**.

See [internal trading and PostgreSQL operations](docs/INTERNAL-TRADING-AND-DATABASE.md), [deployment readiness](docs/DEPLOYMENT-READINESS.md), [market data notes](docs/CRYPTO-MARKET-DATA.md), and the [latest live-site assessment](docs/LIVE-SITE-ASSESSMENT.md).

## Transactional email

The application includes branded HTML and plain-text templates for account, security, funding, withdrawal, KYC, trade and support notifications. Configure a verified sender and provider as described in [transactional email setup](docs/TRANSACTIONAL-EMAIL.md). Provider acceptance is not proof of inbox delivery.

## Local development

Use an isolated PostgreSQL database and configure `.env` from `.env.example`. For managed PostgreSQL, use [`.env.database.example`](.env.database.example) as the reference for the pooled runtime `DATABASE_URL` and direct migration `DIRECT_URL`. For local development, both may point to the same database.

The development seed contains bootstrap staff accounts and simulated configuration; do not run it on a hosted environment or a database containing real data. Test scripts that create or modify records must only run against a disposable database and server.
