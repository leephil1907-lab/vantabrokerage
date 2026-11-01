// Run ONLY against an isolated, freshly initialized review server and disposable database.
// Creates a disposable user and financial account records; never point at real customer data.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
if (process.env.ALLOW_DISPOSABLE_REVIEW_TEST !== '1') throw new Error('Explicitly set ALLOW_DISPOSABLE_REVIEW_TEST=1 for an isolated disposable deployment.');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
try {
  for (const path of ['/', '/markets', '/register']) {
    const res = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    assert.equal(res.status(), 200, path);
  }
  const registration = await page.evaluate(async () => {
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: `review.${Date.now()}@example.test`, password: 'Review!Test2026', firstName: 'Review', lastName: 'Tester', country: 'Nigeria', acceptTerms: true }) });
    return { status: res.status, data: await res.json() };
  });
  assert.equal(registration.status, 201, JSON.stringify(registration.data));
  const data = await page.evaluate(async () => {
    const accounts = await (await fetch('/api/accounts')).json();
    const live = accounts.accounts.find(a => a.type === 'LIVE');
    const paper = accounts.accounts.find(a => a.type === 'PAPER');
    const order = await fetch('/api/trades/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accountId: live.id, symbol: 'BTC/USDT', side: 'BUY', type: 'MARKET', qty: 0.001 }) });
    const deposit = await fetch('/api/wallet/deposits', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accountId: live.id, asset: 'BTC', amount: 1 }) });
    const markets = await (await fetch('/api/markets?category=SPOT')).json();
    return { live, paper, enabled: accounts.liveExecutionEnabled, order: { status: order.status, body: await order.json() }, deposit: { status: deposit.status, body: await deposit.json() }, markets };
  });
  assert.equal(data.live.available, 0);
  assert.equal(data.paper, undefined, 'no paper account is provisioned');
  assert.equal(data.enabled, false);
  assert.equal(data.order.status, 409);
  assert.equal(data.order.body.error.code, 'LIVE_EXECUTION_UNAVAILABLE');
  assert.equal(data.deposit.status, 503);
  assert.equal(data.deposit.body.error.code, 'DEPOSITS_UNAVAILABLE');
  assert.ok(data.markets.markets.length > 0, 'review market definitions present');
  for (const path of ['/dashboard', '/dashboard/deposits', '/dashboard/crypto', '/dashboard/forex']) {
    const res = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    assert.equal(res.status(), 200, path);
    if (path === '/dashboard/deposits') await page.getByText('Funding unavailable').waitFor();
    if (path.endsWith('/crypto') || path.endsWith('/forex')) await page.getByText('Live trading unavailable', { exact: true }).first().waitFor();
  }
  console.log('PASS: fresh review registration, zero starting balances, blocked real orders/deposits, reference markets and private dashboard routes');
} finally { await browser.close(); }
