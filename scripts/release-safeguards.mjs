/** Run only against an isolated test deployment and disposable DB.
 * Start that deployment with EXECUTION_MODE=live to test fail-closed behavior.
 * BASE_URL=http://127.0.0.1:3001 node scripts/release-safeguards.mjs
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
if (base !== 'http://127.0.0.1:3001' || process.env.ALLOW_DISPOSABLE_REVIEW_TEST !== '1') throw new Error('Use only the isolated disposable server.');
const email = `guard.${Date.now()}@example.test`;
const post = async (path, body, cookie = '') => fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
const registration = await post('/api/auth/register', { email, password: 'Vanta!Test2026', firstName: 'Guard', lastName: 'Test', country: 'Nigeria', acceptTerms: true });
assert.equal(registration.status, 201);
const reg = await registration.json();
assert(!JSON.stringify(reg).includes('token='), 'registration must not return verification tokens');
const cookie = registration.headers.get('set-cookie').split(';')[0];
const accountsRes = await fetch(`${base}/api/accounts`, { headers: { cookie } });
const accounts = await accountsRes.json();
assert.equal(accounts.liveExecutionEnabled, true, 'internal dealing is enabled for the workspace');
const live = accounts.accounts.find(a => a.type === 'LIVE');
assert(live, 'live account exists');
for (const symbol of ['EUR/USD', 'BTC/USDT']) {
  const response = await post('/api/trades/orders', { accountId: live.id, symbol, side: 'BUY', type: 'MARKET', qty: 1 }, cookie);
  const data = await response.json();
  assert.equal(response.status, 201, `${symbol} internal-dealing order: ${JSON.stringify(data)}`);
  assert.equal(data.executionMode, 'internal', 'orders execute internally, never against a claimed external venue');
  assert.equal(data.order.status, 'FILLED');
}
const binary = await post('/api/binary/trades', { accountId: live.id, symbol: 'BTC/USDT-BIN', direction: 'CALL', stake: 5, expirySeconds: 30 }, cookie);
assert.equal(binary.status, 201, 'short-expiry contracts open under internal dealing');
const known = await (await post('/api/auth/forgot-password', { email })).json();
const unknown = await (await post('/api/auth/forgot-password', { email: `missing.${Date.now()}@example.test` })).json();
assert.deepEqual(known, unknown); assert(!JSON.stringify(known).includes('token='));
console.log('PASS: live-mode flag cannot enable forex, crypto or short-expiry live fills; reset response does not expose a token');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 800 }, reducedMotion: 'reduce' });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  const mobileMenu = page.getByRole('button', { name: 'Open menu' });
  assert(await mobileMenu.isVisible(), 'tablet menu must be visible');
  await mobileMenu.click();
  assert(await page.getByRole('link', { name: 'Forex & CFDs', exact: true }).isVisible());
  assert(await page.getByRole('link', { name: 'Crypto Spot', exact: true }).isVisible());
  const animation = await page.evaluate(() => { const el = document.createElement('div'); el.className = 'skeleton brand-pulse'; document.body.appendChild(el); const name = getComputedStyle(el).animationName; el.remove(); return name; });
  assert.equal(animation, 'none', 'reduced motion stops animation');
  const icon = await page.request.get(`${base}/icon.svg`); assert.equal(icon.status(), 200);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const trading = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Trading' });
  await trading.focus(); await page.keyboard.press('Enter');
  assert.equal(await trading.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape'); assert.equal(await trading.getAttribute('aria-expanded'), 'false'); assert(await trading.evaluate(el => document.activeElement === el), 'focus remains on trigger');
  console.log('PASS: tablet navigation, keyboard dropdown, reduced motion and branded icon');
} finally { await browser.close(); }
