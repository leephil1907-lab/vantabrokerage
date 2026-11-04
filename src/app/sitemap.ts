import type { MetadataRoute } from 'next';

const ROUTES = [
  '/', '/markets', '/markets/screener',
  '/trading/forex', '/trading/crypto', '/trading/cfd', '/trading/futures', '/trading/short-expiry',
  '/trading-conditions', '/deposits-withdrawals', '/accounts', '/referral-program', '/help', '/contact',
  '/company/about', '/legal/terms', '/legal/privacy', '/legal/risk-disclosure', '/legal/aml', '/legal/cookies',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? 'https://primevest-web.onrender.com';
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === '/' || route === '/markets' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : route.startsWith('/legal') ? 0.3 : 0.7,
  }));
}
