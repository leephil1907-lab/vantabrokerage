# PRIMEVEST

A modern multi-asset trading platform built with Next.js, PostgreSQL and Prisma.

## Deployment

PRIMEVEST is configured for Render. Use the [Render Blueprint](render.yaml) to deploy the web application, background worker and PostgreSQL database.

See [Render deployment](docs/RENDER-DEPLOYMENT.md) for setup instructions.

## Development

Install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Configure your environment variables using `.env.example`.

## Email

Configure a verified email provider for account verification and password-reset messages. See [Transactional Email](docs/TRANSACTIONAL-EMAIL.md).
