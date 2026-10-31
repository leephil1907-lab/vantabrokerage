/**
 * Authenticated app QA.
 *
 *   node scripts/app-qa.mjs [route...]
 *
 * Logs in with the seed admin, walks dashboard routes, captures desktop +
 * mobile screenshots, console errors, failed requests and overflow. Exits
 * non-zero when a route reports a problem.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const OUT = process.env.SHOT_DIR || '/tmp/shots/app';
const EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@vantamarkets.com';
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Vanta!Admin2026';
mkdirSync(OUT, { recursive: true });

const routes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/dashboard', '/dashboard/forex', '/dashboard/crypto', '/dashboard/short-expiry', '/dashboard/futures', '/dashboard/wallet', '/dashboard/positions', '/admin'];

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.fill('input[type=email]', EMAIL);
await page.fill('input[type=password]', PASSWORD);
await page.click('button[type=submit]');
await page.waitForURL('**/dashboard**', { timeout: 45_000 });

const FREEZE = '*,*::before,*::after{animation-play-state:paused !important;animation-duration:.001ms !important;transition-duration:.001ms !important}';
const report = [];

for (const route of routes) {
  const errors = [];
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message.split('\n')[0].slice(0, 160)));
  p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().split('\n')[0].slice(0, 160)); });
  p.on('requestfailed', (r) => { if (!/favicon|_rsc/.test(r.url())) errors.push('requestfailed: ' + r.url().slice(-70)); });
  const res = await p.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60_000 }).catch((e) => ({ status: () => 'ERR ' + e.message.slice(0, 60) }));
  await p.waitForTimeout(3500);
  await p.addStyleTag({ content: FREEZE }).catch(() => {});
  const metrics = await p.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    canvases: document.querySelectorAll('canvas').length,
    skeletons: document.querySelectorAll('.skeleton, .skeleton-shimmer').length,
    emptySvgs: [...document.querySelectorAll('svg')].filter((s) => !s.innerHTML.trim()).length,
    brokenImgs: [...document.querySelectorAll('img')].filter((i) => !i.complete || i.naturalWidth === 0).length,
  }));
  await p.screenshot({ path: path.join(OUT, `${route.replace(/\W+/g, '_') || 'root'}.png`), timeout: 60_000, animations: 'disabled' }).catch(() => {});
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(1200);
  await p.addStyleTag({ content: FREEZE }).catch(() => {});
  await p.screenshot({ path: path.join(OUT, `${route.replace(/\W+/g, '_') || 'root'}-mobile.png`), timeout: 60_000, animations: 'disabled' }).catch(() => {});
  report.push({ route, status: typeof res?.status === 'function' ? res.status() : res, metrics, errors: [...new Set(errors)] });
  await p.close();
}

await browser.close();
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
let bad = 0;
for (const r of report) {
  const issues = [...r.errors];
  if (r.metrics.overflowX > 2) issues.push(`overflow-x ${r.metrics.overflowX}px`);
  if (r.metrics.brokenImgs) issues.push(`${r.metrics.brokenImgs} broken images`);
  if (r.metrics.emptySvgs) issues.push(`${r.metrics.emptySvgs} empty svg`);
  if (issues.length) bad++;
  console.log(`${r.route} [${r.status}] canvas:${r.metrics.canvases} skeletons:${r.metrics.skeletons} ${issues.length ? 'ISSUES →' : 'ok'}`);
  issues.slice(0, 6).forEach((i) => console.log('   ·', i));
}
process.exit(bad ? 1 : 0);
