import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3001';
const email = `terminal-ui.${Date.now()}@example.test`;
const registration = await fetch(`${base}/api/auth/register`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password: 'Terminal!Test2026', firstName: 'Terminal', lastName: 'Tester', country: 'Nigeria', acceptTerms: true }),
});
assert.equal(registration.status, 201, await registration.text());
const setCookie = registration.headers.get('set-cookie') ?? '';
const token = setCookie.match(/vanta_session=([^;]+)/)?.[1];
assert.ok(token, 'registration should create an authenticated session');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
await context.addCookies([{ name: 'vanta_session', value: token, domain: '127.0.0.1', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }]);
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));

try {
  await page.goto(`${base}/dashboard/trade?symbol=EUR%2FUSD`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Open Demo Account' }).first().waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: 'Open Demo Account' }).first().click();
  await page.locator('span:visible').filter({ hasText: 'Demo · simulated' }).first().waitFor({ timeout: 10000 });
  await page.locator('label:visible').filter({ hasText: 'Quantity' }).locator('input').fill('100');
  await page.locator('button:visible').filter({ hasText: /Place demo buy order/i }).click();
  await page.getByRole('status').filter({ hasText: 'Demo order filled' }).waitFor({ timeout: 15000 });
  await page.getByText('Demo Trading', { exact: true }).last().waitFor();
  const mobileWidth = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(mobileWidth.document <= mobileWidth.viewport + 4, `mobile page overflows horizontally: ${JSON.stringify(mobileWidth)}`);

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.locator('p:visible').filter({ hasText: 'Place Trade' }).first().waitFor();
  await page.locator('span:visible').filter({ hasText: 'Demo · simulated' }).first().waitFor();
  const desktopWidth = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(desktopWidth.document <= desktopWidth.viewport + 4, `desktop page overflows horizontally: ${JSON.stringify(desktopWidth)}`);
  assert.deepEqual(errors, [], `browser runtime errors: ${errors.join('; ')}`);
  console.log('PASS: authenticated terminal renders on mobile and desktop; demo account can be opened from the UI; order ticket submits a persisted demo order; no browser runtime errors or horizontal page overflow.');
} finally {
  await browser.close();
}
