/** Captures the screenshots referenced by the docs (docs/screenshots/*.png). */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });

const FREEZE = '*,*::before,*::after{animation-play-state:paused !important;animation-duration:.001ms !important;transition-duration:.001ms !important}';
const browser = await chromium.launch({ args: ['--no-sandbox'] });

const shoot = async (ctx, url, file, opts = {}) => {
  const p = await ctx.newPage();
  await p.goto(BASE + url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(opts.wait ?? 5000);
  await p.addStyleTag({ content: FREEZE }).catch(() => {});
  await p.screenshot({ path: path.join(OUT, file), timeout: 60_000, animations: 'disabled' });
  await p.close();
  console.log('captured', file);
};

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

await shoot(desktop, '/', 'home-desktop.png', { wait: 6000 });
await shoot(desktop, '/markets', 'markets-desktop.png', { wait: 5000 });
await shoot(mobile, '/', 'home-mobile.png', { wait: 5000 });

// authenticated
const login = await desktop.newPage();
await login.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
await login.waitForTimeout(1500);
await login.fill('input[type=email]', process.env.SEED_ADMIN_EMAIL || 'admin@vantamarkets.com');
await login.fill('input[type=password]', process.env.SEED_ADMIN_PASSWORD || 'Vanta!Admin2026');
await login.click('button[type=submit]');
await login.waitForURL('**/dashboard**', { timeout: 45_000 });
await login.close();
await shoot(desktop, '/dashboard', 'dashboard-overview.png', { wait: 5000 });
await shoot(desktop, '/dashboard/forex', 'terminal-forex.png', { wait: 9000 });
await shoot(desktop, '/dashboard/crypto', 'terminal-crypto.png', { wait: 9000 });
await browser.close();
