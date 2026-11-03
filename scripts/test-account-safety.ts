/** Internal-dealing safeguard test: ONLY against the disposable local vanta_nodemo_test database/server. */
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
  await prisma.rateLimitBucket.deleteMany({}); // disposable test DB: reset rate limits between runs
  const email = `safety.${Date.now()}@example.test`;
  const registration = await request('/api/auth/register', 'POST', { email, password: 'Review!Test2026', firstName: 'Test', lastName: 'Client', country: 'Nigeria', acceptTerms: true });
  assert.equal(registration.status, 201, JSON.stringify(registration.body));
  assert.ok(cookie);
  const user = await prisma.user.findUniqueOrThrow({ where: { email }, include: { accounts: { include: { wallet: true } } } });
  assert.equal(user.accounts.length, 2, 'new registration provisions a live and a demo account');
  const live = user.accounts.find((a) => a.type === 'LIVE')!;
  const demo = user.accounts.find((a) => a.type === 'PAPER')!;
  assert.equal(Number(live.wallet?.available), 0, 'live accounts start at zero');
  assert.equal(Number(demo.wallet?.available), 100000, 'the demo account receives labelled virtual starting capital');
  const capital = await prisma.ledgerTransaction.findFirst({ where: { reference: `virtual-capital:${demo.id}` } });
  assert.ok(capital, 'virtual capital is posted through the ledger');
  assert.match(String(capital?.description), /no cash value/i, 'virtual capital is labelled as non-cash');

  // Historical account/order/trade fixture. Direct DB writes are only for this disposable test.
  const paper = await prisma.account.update({ where: { id: demo.id }, data: { wallet: { update: { available: '5000', locked: '100' } } }, include: { wallet: true } });
  const pair = await prisma.tradingPair.findUniqueOrThrow({ where: { symbol: 'EUR/USD' } });
  const binaryPair = await prisma.tradingPair.findUniqueOrThrow({ where: { symbol: 'EUR/USD-BIN' } });
  const order = await prisma.order.create({ data: { accountId: paper.id, pairId: pair.id, symbol: pair.symbol, category: pair.category, side: 'BUY', type: 'LIMIT', qty: '1', price: '0.00001', reserved: '100' } });
  const binary = await prisma.binaryTrade.create({ data: { accountId: paper.id, pairId: binaryPair.id, symbol: binaryPair.symbol, direction: 'CALL', stake: '5', payoutRate: '0.85', entryPrice: '1.10', expiresAt: new Date(Date.now() - 60000), entryQuoteTs: new Date(), priceFeed: 'fixture', env: 'PAPER' } });

  const accountList = await request('/api/accounts');
  assert.equal(accountList.body.liveExecutionEnabled, true, 'internal dealing is advertised to the workspace');
  assert.deepEqual(accountList.body.accounts.map((a: { id: string }) => a.id).sort(), [live.id, paper.id].sort());
  const overview = await request('/api/overview');
  assert.equal(overview.status, 200);
  assert.equal(overview.body.executionMode, 'paper', 'the funded demo workspace is the default view');
  assert.equal(overview.body.activeAccount.id, paper.id);
  const liveOverview = await request(`/api/overview?accountId=${live.id}`);
  assert.equal(liveOverview.status, 200, 'the live account is available in the workspace');
  assert.equal(liveOverview.body.executionMode, 'internal');

  // Fund the live wallet for this disposable test (live accounts start at zero).
  await prisma.wallet.update({ where: { accountId: live.id }, data: { available: '10000' } });

  // Internal dealing: customer orders fill at the reference quote with venue provenance.
  const market = await request('/api/trades/orders', 'POST', { accountId: live.id, symbol: pair.symbol, side: 'BUY', type: 'MARKET', qty: 0.01, leverage: 10, marginMode: 'CROSS' });
  assert.equal(market.status, 201, JSON.stringify(market.body));
  assert.equal(market.body.order.status, 'FILLED');
  assert.equal(market.body.executionMode, 'internal');
  const fill = await prisma.execution.findFirstOrThrow({ where: { orderId: market.body.order.id } });
  assert.equal(fill.venue, 'internal-dealing', 'fills carry internal-dealing provenance, never an external venue claim');
  const resting = await request('/api/trades/orders', 'POST', { accountId: live.id, symbol: pair.symbol, side: 'BUY', type: 'LIMIT', qty: 0.01, price: 0.5, leverage: 10, marginMode: 'CROSS' });
  assert.equal(resting.status, 201);
  assert.equal(resting.body.order.status, 'OPEN', 'far limit orders rest for the matcher');
  const shortExpiry = await request('/api/binary/trades', 'POST', { accountId: live.id, symbol: binaryPair.symbol, direction: 'CALL', stake: 5, expirySeconds: 30 });
  assert.equal(shortExpiry.status, 201, JSON.stringify(shortExpiry.body));
  assert.equal(shortExpiry.body.trade.result, 'OPEN');

  // Money safeguards that remain in force.
  const transfer = await request('/api/wallet/transfer', 'POST', { fromAccountId: paper.id, toAccountId: live.id, amount: 10 });
  assert.equal(transfer.status, 409);
  assert.equal(transfer.body.error.code, 'CROSS_ENVIRONMENT_TRANSFER');
  const cancel = await request(`/api/trades/orders/${order.id}`, 'DELETE');
  assert.equal(cancel.status, 200, JSON.stringify(cancel.body));
  assert.equal(cancel.body.order.status, 'CANCELLED');
  // Deposits: submission-only. Manual finance review; nothing auto-credits.
  const liveWalletBefore = await prisma.wallet.findUniqueOrThrow({ where: { accountId: live.id } });
  const txHash = `0x${'a'.repeat(62)}`;
  const deposit = await request('/api/wallet/deposits', 'POST', { accountId: live.id, asset: 'BTC', network: 'Bitcoin', amountUsd: 250, txHash });
  assert.equal(deposit.status, 201, JSON.stringify(deposit.body));
  assert.equal(deposit.body.deposit.status, 'PENDING', 'submitted deposits await finance review');
  const dup = await request('/api/wallet/deposits', 'POST', { accountId: live.id, asset: 'BTC', network: 'Bitcoin', amountUsd: 250, txHash });
  assert.equal(dup.status, 409, 'a tx hash can only be submitted once');
  const badNetwork = await request('/api/wallet/deposits', 'POST', { accountId: live.id, asset: 'BTC', network: 'Solana', amountUsd: 10, txHash: `0x${'b'.repeat(62)}` });
  assert.equal(badNetwork.status, 400, 'unsupported asset/network pairs are rejected');
  const noHash = await request('/api/wallet/deposits', 'POST', { accountId: live.id, asset: 'BTC', network: 'Bitcoin', amountUsd: 10 });
  assert.ok(noHash.status === 400 || noHash.status === 422, 'a transaction hash is mandatory');
  const liveWalletAfter = await prisma.wallet.findUniqueOrThrow({ where: { accountId: live.id } });
  assert.equal(Number(liveWalletAfter.available), Number(liveWalletBefore.available), 'submitted deposits never credit funds before finance review');

  await request('/api/binary/trades'); // no settlement-on-read
  const worker = spawn('npx', ['tsx', 'src/worker/index.ts'], { env: process.env, stdio: 'ignore', detached: true });
  try { await new Promise(r => setTimeout(r, 12000)); assert.equal(worker.exitCode, null, 'worker started'); }
  finally { if (worker.pid) process.kill(-worker.pid, 'SIGTERM'); }

  const afterOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  const afterBinary = await prisma.binaryTrade.findUniqueOrThrow({ where: { id: binary.id } });
  const afterWallet = await prisma.wallet.findUniqueOrThrow({ where: { accountId: paper.id } });
  assert.equal(afterOrder.status, 'CANCELLED');
  assert.notEqual(afterBinary.result, 'OPEN', 'the worker settles expired short-expiry contracts');
  assert.ok(afterBinary.settledAt, 'settlement records its timestamp');
  assert.equal(Number(afterWallet.locked), 0, 'cancelled reservations and settled stakes release locked funds');
  // 5000 start + 100 reservation released by the cancel, then the settlement outcome.
  const expectedAvailable = afterBinary.result === 'WIN' ? 5109.25 : afterBinary.result === 'LOSS' ? 5095 : 5100;
  assert.equal(Number(afterWallet.available), expectedAvailable, `settlement payout matches result ${afterBinary.result}`);
  const jobs = await prisma.jobRun.findMany({ where: { status: 'FAILED' }, select: { name: true } });
  assert.deepEqual(jobs, [], `worker jobs must not fail: ${JSON.stringify(jobs)}`);
  console.log('PASS: internal dealing fills with provenance; resting orders, short-expiry and worker settlement live; virtual capital labelled; transfers segregated; deposits manual-review with zero auto-credit; ledger-consistent.');
}
main().catch(err => { console.error(err); process.exitCode = 1; }).finally(() => prisma.$disconnect());
