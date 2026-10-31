# PRIMEVEST

Next.js forex and crypto market website and account workspace.

## Vercel review deployment

See **[the protected Vercel review runbook](docs/VERCEL-REVIEW-DEPLOYMENT.md)** for the database, environment variables, market-only initialization and verification steps. The Vercel build validates configuration and generates Prisma Client; database migrations and review market setup are separate, deliberate steps.

This repository contains an internal matching workflow for the PAPER account, using provider-sourced reference quotes and a server-side execution worker. It is not a public exchange order book, does not route to an external broker, and does not represent external liquidity. LIVE-account order entry and customer deposits remain disabled; withdrawals are not automated without a connected custody/payment provider. The application is **not ready for public real-money trading or customer funds**. See [internal trading and PostgreSQL operations](docs/INTERNAL-TRADING-AND-DATABASE.md), [deployment readiness](docs/DEPLOYMENT-READINESS.md), and [market data notes](docs/CRYPTO-MARKET-DATA.md).

## Local development

Use an isolated PostgreSQL database and configure `.env` from `.env.example`. Managed PostgreSQL providers commonly offer a pooled runtime URL and a direct migration URL; configure Prisma's `DATABASE_URL` and `DIRECT_URL` accordingly. For local development both may point to the same database. For managed PostgreSQL, set `DATABASE_URL` to the provider's pooled runtime URL and `DIRECT_URL` to its direct migration URL; for local development both may point to the same database. The development seed contains bootstrap staff accounts and simulated configuration; do not run it on a hosted environment or a database containing real data. The test scripts create and modify data and must only run against a disposable database and server.
