// Tests the live-account design and deposit fail-closed behavior against a disposable test server/database.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
try {
  await page.goto(base + '/login');
  await page.fill('input[type=email]', process.env.SEED_ADMIN_EMAIL || 'admin@vantamarkets.com');
  await page.fill('input[type=password]', process.env.SEED_ADMIN_PASSWORD || 'Vanta!Admin2026');
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard**');
  const accounts = await page.evaluate(async () => (await fetch('/api/accounts')).json());
  assert.ok(accounts.accounts, `accounts API: ${JSON.stringify(accounts)}`);
  const live = accounts.accounts.find(a => a.type === 'LIVE');
  const paper = accounts.accounts.find(a => a.type === 'PAPER');
  assert.ok(live && paper);
  // A previously-selected paper account must not leak simulated balances into these views.
  await page.evaluate(id => localStorage.setItem('vanta.accountId', id), paper.id);
  await page.goto(base + '/dashboard');
  await page.getByText('Ledger balance · custody not connected').waitFor();
  assert.equal(await page.getByText('SIMULATED', { exact: false }).count(), 0);

  await page.goto(base + '/dashboard/deposits');
  await page.getByText('Funding is not available yet').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Deposits unavailable' }).isDisabled(), true);
  await page.getByRole('tab', { name: /Bank transfer/ }).click();
  await page.getByText('Bank details will be shown only').waitFor();
  await page.getByRole('tab', { name: /Crypto/ }).click();
  await page.locator('#deposit-asset').selectOption('ETH');
  const testDeposit = await page.evaluate(async id => {
    const get = async () => (await fetch('/api/wallet/deposits?accountId=' + id)).json();
    const before = await get();
    const res = await fetch('/api/wallet/deposits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: id, asset: 'ETH', amount: 10, txHash: '0x12345678901234567890' }) });
    return { before, status: res.status, body: await res.json(), after: await get() };
  }, live.id);
  const { before, after } = testDeposit;
  assert.equal(testDeposit.status, 503);
  assert.equal(testDeposit.body.error.code, 'DEPOSITS_UNAVAILABLE');
  assert.equal(after.deposits.length, before.deposits.length);

  for (const route of ['/dashboard/crypto', '/dashboard/forex']) {
    await page.goto(base + route);
    await page.getByText('Order book unavailable').first().waitFor({ timeout: 30000 });
    assert.equal(await page.getByRole('button', { name: 'Trading unavailable' }).isDisabled(), true);
    assert.equal(await page.getByText('Indicative depth model').count(), 0);
    await page.getByRole('button', { name: 'sell', exact: true }).first().click();
    await page.getByRole('button', { name: 'limit', exact: true }).first().click();
    await page.getByText('Limit price').first().waitFor();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/dashboard', '/dashboard/deposits', '/dashboard/crypto', '/dashboard/forex']) {
    await page.goto(base + route);
    await page.waitForTimeout(1500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 2, `${route} has ${overflow}px horizontal overflow`);
  }
  console.log('PASS: live-account views, funding tabs, blocked deposit API without mutation, disabled order ticket, no fabricated depth, mobile overflow');
} finally { await browser.close(); }
