# PRIMEVEST

Next.js forex and crypto market website and account workspace.

## Vercel review deployment

See **[the protected Vercel review runbook](docs/VERCEL-REVIEW-DEPLOYMENT.md)** for the database, environment variables, market-only initialization and verification steps. The Vercel build validates configuration and generates Prisma Client; database migrations and review market setup are separate, deliberate steps.

This repository is **not ready for public real-money trading or deposits**. Live execution and customer deposit requests are disabled, and there is no internal matching engine or connected custody/payment system. Some legacy pages and APIs still provide simulated functionality. See [deployment readiness](docs/DEPLOYMENT-READINESS.md) and [market data notes](docs/CRYPTO-MARKET-DATA.md).

## Local development

Use an isolated PostgreSQL database and configure `.env` from `.env.example`. The development seed contains bootstrap staff accounts and simulated configuration; do not run it on a hosted environment or a database containing real data. The test scripts create and modify data and must only run against a disposable database and server.
