# PRIMEVEST

A multi-market account workspace for market information, account management and support.

## Current operating state

PRIMEVEST currently provides market discovery and provider-sourced reference prices. **Order execution is unavailable for every account type.** New registrations create one empty LIVE account; no PAPER account or simulated starting balance is provisioned. Historical PAPER accounts, balances and trading records are preserved in the database but are not exposed through normal account selection or processed by the current worker.

Customer deposits and withdrawals are not available as payment or custody services. Do not send funds or cryptocurrency. No external broker, exchange execution venue or custody provider is connected.

See [account transition and execution safeguards](docs/ACCOUNT-TRANSITION.md), [deployment readiness](docs/DEPLOYMENT-READINESS.md), [PostgreSQL operations](docs/INTERNAL-TRADING-AND-DATABASE.md), [market data notes](docs/CRYPTO-MARKET-DATA.md), and the [live-site assessment](docs/LIVE-SITE-ASSESSMENT.md).

## Transactional email

The application includes branded HTML and plain-text templates for account, security, funding, withdrawal, KYC, trade and support notifications. Configure a verified sender and provider as described in [transactional email setup](docs/TRANSACTIONAL-EMAIL.md). Provider acceptance is not proof of inbox delivery.

## Local development

Use an isolated PostgreSQL database and configure `.env` from `.env.example`. For managed PostgreSQL, use [`.env.database.example`](.env.database.example) as the reference for pooled runtime `DATABASE_URL` and direct migration `DIRECT_URL`. For local development, both may point to the same database.

The development seed contains bootstrap staff accounts and simulated configuration; do not run it on a hosted environment or a database containing real data. Test scripts that create or modify records must only run against the disposable database explicitly required by each script.
