/** Safeguard integration test: ONLY against the disposable local vanta_nodemo_test database/server. */
import { PrismaClient } from '@prisma/client';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const url = new URL(process.env.DATABASE_URL ?? '');
const base = process.env.BASE_URL ?? 'http://127.0.0.1:3001';
if (process.env.ALLOW_DISPOSABLE_ACCOUNT_TEST !== '1' || url.hostname !== '127.0.0.1' || url.pathname !== '/vanta_nodemo_test' || base !== 'http://127.0.0.1:3001') throw new Error('Requires the isolated disposable vanta_nodemo_test database and localhost:3001 server.');
const prisma = new PrismaClient();
let cookie = '';
async function request(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(base + path, { method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const received = res.headers.getSetCookie?.().find(c => c.startsWith('vanta_session='));
  if (received) cookie = received.split(';')[0];
  return { status: res.status, body: await res.json() };
}
async function main() {
  const email = `safety.${Date.now()}@example.test`;
  const registration = await request('/api/auth/register', 'POST', { email, password: 'Review!Test2026', firstName: 'Test', lastName: 'Client', country: 'Nigeria', acceptTerms: true });
  assert.equal(registration.status, 201, JSON.stringify(registration.body));
  assert.ok(cookie);
  const user = await prisma.user.findUniqueOrThrow({ where: { email }, include: { accounts: { include: { wallet: true } } } });
  assert.equal(user.accounts.length, 1, 'new registration provisions exactly one account');
  const live = user.accounts[0];
  assert.equal(live.type, 'LIVE');
  assert.equal(Number(live.wallet?.available), 0);
  // Historical account/order/trade fixture. Direct DB writes are only for this disposable test.
  const paper = await prisma.account.create({ data: { userId: user.id, type: 'PAPER', wallet: { create: { available: '5000', locked: '100' } } }, include: { wallet: true } });
  const pair = await prisma.tradingPair.findUniqueOrThrow({ where: { symbol: 'EUR/USD' } });
  const binaryPair = await prisma.tradingPair.create({ data: { symbol: `TEST${Date.now()}/USDT-BIN`, displayName: 'Historical fixture', baseAsset: 'TEST', quoteAsset: 'USDT', assetClass: 'CRYPTO', category: 'BINARY' } });
  const order = await prisma.order.create({ data: { accountId: paper.id, pairId: pair.id, symbol: pair.symbol, category: pair.category, side: 'BUY', type: 'LIMIT', qty: '1', price: '0.00001', reserved: '100' } });
  const binary = await prisma.binaryTrade.create({ data: { accountId: paper.id, pairId: binaryPair.id, symbol: binaryPair.symbol, direction: 'CALL', stake: '5', payoutRate: '0.85', entryPrice: '100', expiresAt: new Date(Date.now()-60000), entryQuoteTs: new Date(), priceFeed: 'fixture', env: 'PAPER' } });
  const accountList = await request('/api/accounts');
  assert.deepEqual(accountList.body.accounts.map((a: { id: string }) => a.id), [live.id]);
  const overview = await request('/api/overview');
  assert.equal(overview.status, 200);
  assert.equal(overview.body.accounts.length, 1);
  assert.equal(overview.body.activeAccount.id, live.id);
  assert.equal((await request(`/api/overview?accountId=${paper.id}`)).status, 404, 'explicit historical account does not silently fall back');
  assert.equal((await request(`/api/binary/trades?accountId=${paper.id}`)).status, 404);
  const countsBefore = { orders: await prisma.order.count(), executions: await prisma.execution.count(), binaries: await prisma.binaryTrade.count(), deposits: await prisma.deposit.count() };
  for (const account of [live]) {
    for (const type of ['MARKET', 'LIMIT']) {
      const res = await request('/api/trades/orders', 'POST', { accountId: account.id, symbol: pair.symbol, side: 'BUY', type, qty: 1, ...(type === 'LIMIT' ? { price: 1 } : {}) });
      assert.equal(res.status, 409, JSON.stringify(res));
      assert.equal(res.body.error.code, 'LIVE_EXECUTION_UNAVAILABLE');
    }
    const res = await request('/api/binary/trades', 'POST', { accountId: account.id, symbol: binaryPair.symbol, direction: 'CALL', stake: 5, expirySeconds: 30 });
    assert.equal(res.status, 409, JSON.stringify(res));
    assert.equal(res.body.error.code, 'LIVE_EXECUTION_UNAVAILABLE');
  }
  const transfer = await request('/api/wallet/transfer', 'POST', { fromAccountId: paper.id, toAccountId: live.id, amount: 10 });
  assert.equal(transfer.status, 409);
  assert.equal(transfer.body.error.code, 'CROSS_ENVIRONMENT_TRANSFER');
  const cancel = await request(`/api/trades/orders/${order.id}`, 'DELETE');
  assert.equal(cancel.status, 200, JSON.stringify(cancel.body));
  assert.equal(cancel.body.order.status, 'CANCELLED');
  const deposit = await request('/api/wallet/deposits', 'POST', { accountId: live.id, asset: 'BTC', amount: 1 });
  assert.equal(deposit.status, 503);
  assert.equal(deposit.body.error.code, 'DEPOSITS_UNAVAILABLE');
  await request('/api/binary/trades'); // no settlement-on-read
  const worker = spawn('npx', ['tsx', 'src/worker/index.ts'], { env: process.env, stdio: 'ignore', detached: true });
  try { await new Promise(r => setTimeout(r, 7000)); assert.equal(worker.exitCode, null, 'worker started'); }
  finally { if (worker.pid) process.kill(-worker.pid, 'SIGTERM'); }
  const afterOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  const afterBinary = await prisma.binaryTrade.findUniqueOrThrow({ where: { id: binary.id } });
  const afterWallet = await prisma.wallet.findUniqueOrThrow({ where: { accountId: paper.id } });
  assert.equal(afterOrder.status, 'CANCELLED');
  assert.equal(afterBinary.result, 'OPEN');
  assert.equal(Number(afterWallet.available), 5100);
  assert.equal(Number(afterWallet.locked), 0);
  assert.deepEqual({ orders: await prisma.order.count(), executions: await prisma.execution.count(), binaries: await prisma.binaryTrade.count(), deposits: await prisma.deposit.count() }, countsBefore);
  console.log('PASS: live-only registration; historical accounts and records preserved; explicit ID rejected; orders/binary/deposits blocked; transfers segregated; worker and reads do not process historical orders or settlement.');
}
main().catch(err => { console.error(err); process.exitCode = 1; }).finally(() => prisma.$disconnect());
