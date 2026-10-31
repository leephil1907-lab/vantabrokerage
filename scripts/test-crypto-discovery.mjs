/** Smoke-test against a running disposable deployment: node scripts/test-crypto-discovery.mjs */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const response = await fetch(`${base}/api/markets/crypto-discovery`);
assert.equal(response.status, 200);
const data = await response.json();
assert.equal(data.source, 'CoinGecko');
assert(data.assets.length >= 20 && data.assets.length <= 250);
assert(data.assets.every((a) => !a.image || new URL(a.image).hostname === 'coin-images.coingecko.com'));
assert(data.assets.some((a) => a.id === 'bitcoin' && a.priceUsd > 0 && a.image && a.updatedAt));
const again = await (await fetch(`${base}/api/markets/crypto-discovery`)).json();
assert.equal(data.fetchedAt, again.fetchedAt, 'consecutive requests should reuse the server cache');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${base}/markets`, { waitUntil: 'domcontentloaded' });
  const section = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Explore crypto markets' }) });
  await section.getByText('Market directory').waitFor();
  await section.getByText('Bitcoin', { exact: true }).waitFor({ timeout: 20000 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), true, 'no mobile page overflow');
  assert.equal(await section.locator('tbody tr').count(), 25);
  await section.getByRole('button', { name: 'Next' }).click();
  assert.equal(await section.getByRole('button', { name: 'Previous' }).isEnabled(), true);
  await section.getByLabel('Search crypto assets').fill('bitcoin');
  await section.getByText('Bitcoin', { exact: true }).first().waitFor();
  assert.equal(await section.getByRole('button', { name: 'Previous' }).isDisabled(), true);
  await section.getByLabel('Search crypto assets').fill('thisassetdoesnotexisttest');
  assert(await section.getByText('No assets match your search.').isVisible());
  // Simulate a provider outage. No prices should be fabricated when no cache is available.
  await page.route('**/api/markets/crypto-discovery', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) }));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByText('Market data is temporarily unavailable.', { exact: true }).waitFor();
  // Use real fetched rows with a stale flag to exercise visible delayed-state messaging.
  await page.unroute('**/api/markets/crypto-discovery');
  await page.route('**/api/markets/crypto-discovery', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...data, stale: true }) }));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByText(/Delayed · fetched/).first().waitFor();
  console.log(`PASS: ${data.assets.length} real CoinGecko assets, server cache, mobile layout, search, pagination, outage and stale states`);
} finally { await browser.close(); }
