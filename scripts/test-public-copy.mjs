// Check public pages against an isolated server. No registration or customer data is written.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
if (base !== 'http://127.0.0.1:3001') throw new Error('Use the local disposable test server.');
const pages = ['/', '/markets', '/register', '/login', '/accounts', '/company/about', '/help', '/trading/forex', '/trading/crypto', '/trading/cfd', '/trading/futures', '/trading/short-expiry', '/trading-conditions', '/deposits-withdrawals', '/legal/terms', '/legal/risk-disclosure'];
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const path of pages) {
      const res = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
      assert.equal(res.status(), 200, path);
      await page.waitForTimeout(150);
      const text = await page.locator('body').innerText();
      assert.doesNotMatch(text, /\b(paper|demo|demonstration|simulated|simulation)\b/i, `${path}: legacy demo copy`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 2, `${path} at ${width}px overflow ${overflow}px`);
    }
    await page.close();
  }
  console.log(`PASS: ${pages.length} public pages at desktop and mobile sizes; no demo copy or horizontal overflow`);
} finally { await browser.close(); }
