# PRIMEVEST

Next.js 15 multi-asset brokerage interface with PostgreSQL persistence, Prisma, and a separate market/practice-trading worker.

## Render deployment

The primary deployment configuration is [Render Blueprint](render.yaml). See the [Render deployment runbook](docs/RENDER-DEPLOYMENT.md) for the service layout, first deployment steps, health verification and required email setup.

The Blueprint provisions the web application, background worker and a private PostgreSQL database in Frankfurt. It uses Render's internal database connection, runs committed Prisma migrations before the web service starts, seeds reference market metadata only, and exposes a database-aware health endpoint at `/api/health`.

## Current operating limits

This repository is **not ready for public real-money trading or customer deposits**. LIVE execution is hard-blocked; customer deposit requests are disabled; there is no live broker/exchange adapter, internal matching engine, custody provider or payment integration. Some PAPER/demo functionality and provider-sourced market references are available. See [deployment readiness](docs/DEPLOYMENT-READINESS.md) and [market data notes](docs/CRYPTO-MARKET-DATA.md).

## Transactional email

See [branded email setup and preview](docs/TRANSACTIONAL-EMAIL.md). Delivery requires an independently configured email provider and verified sender.

## Legacy Vercel review notes

The previous protected Vercel review runbook remains available at [docs/VERCEL-REVIEW-DEPLOYMENT.md](docs/VERCEL-REVIEW-DEPLOYMENT.md). Render is the prepared primary hosting target.

## Local development

Use an isolated PostgreSQL database and configure `.env` from `.env.example`. The development seed contains bootstrap staff accounts and simulated configuration; do not run it on a hosted environment or a database containing real data. The test scripts create and modify data and must only run against a disposable database and server.
