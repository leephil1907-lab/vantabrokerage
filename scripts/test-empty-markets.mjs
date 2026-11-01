// Run only against an isolated server with a migrated, empty instrument database.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
if (process.env.ALLOW_DISPOSABLE_MARKET_TEST !== '1') throw new Error('Run only against an isolated empty market database.');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const candles = [];
    page.on('request', r => { if (/\/api\/markets\/.*\/candles/.test(r.url())) candles.push(r.url()); });
    const res = await page.goto(base, { waitUntil: 'domcontentloaded' });
    assert.equal(res.status(), 200);
    await page.getByText('Feed unavailable', { exact: true }).first().waitFor();
    await page.getByText('Chart unavailable for this market').first().waitFor();
    await page.getByText('No market quotes are available right now.').waitFor();
    await page.waitForTimeout(1500);
    assert.equal(candles.length, 0, 'empty market should not request chart candles');
    const instrument = page.locator('div').filter({ has: page.getByText('Configured instruments', { exact: true }) }).filter({ hasText: '0' }).last();
    assert.ok(await instrument.count(), 'configured instruments should show zero');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 2, `horizontal overflow: ${overflow}px`);
    await page.close();
  }
  console.log('PASS: unavailable feed/chart, zero configured markets, no unnecessary candle requests, desktop/mobile layout');
} finally { await browser.close(); }
