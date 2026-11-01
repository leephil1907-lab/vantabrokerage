/** End-to-end practice trading test. Only runs against disposable local PostgreSQL + localhost. */
import { PrismaClient } from '@prisma/client';
import assert from 'node:assert/strict';
import { matchRestingOrders } from '../src/lib/execution';

const url = new URL(process.env.DATABASE_URL ?? '');
const base = process.env.BASE_URL ?? 'http://127.0.0.1:3001';
if (process.env.ALLOW_DISPOSABLE_PAPER_TEST !== '1' || url.hostname !== '127.0.0.1' || url.pathname !== '/vanta_nodemo_test' || base !== 'http://127.0.0.1:3001') {
  throw new Error('Requires the isolated disposable vanta_nodemo_test database and localhost:3001 server.');
}
const prisma = new PrismaClient();
let cookie = '';
async function request(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(base + path, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const received = res.headers.getSetCookie?.().find(c => c.startsWith('vanta_session='));
  if (received) cookie = received.split(';')[0];
  return { status: res.status, body: await res.json() };
}

async function main() {
  const email = `paper-flow.${Date.now()}@example.test`;
  const registration = await request('/api/auth/register', 'POST', {
    email, password: 'Practice!Test2026', firstName: 'Practice', lastName: 'Trader', country: 'Nigeria', acceptTerms: true,
  });
  assert.equal(registration.status, 201, JSON.stringify(registration.body));
  const liveAccounts = await request('/api/accounts');
  assert.equal(liveAccounts.status, 200);
  assert.equal(liveAccounts.body.accounts.length, 1);
  const liveId = liveAccounts.body.accounts[0].id as string;

  const opened = await request('/api/accounts', 'POST');
  assert.equal(opened.status, 201, JSON.stringify(opened.body));
  const paperId = opened.body.account.id as string;
  assert.equal(opened.body.account.type, 'PAPER');
  assert.equal(opened.body.account.available, 100000);
  const repeated = await request('/api/accounts', 'POST');
  assert.equal(repeated.body.account.id, paperId, 'practice account creation is idempotent');
  const accountList = await request('/api/accounts');
  assert.deepEqual(accountList.body.accounts.map((a: { type: string }) => a.type).sort(), ['LIVE', 'PAPER']);

  const pair = await prisma.tradingPair.findUniqueOrThrow({ where: { symbol: 'EUR/USD' } });
  const now = new Date();
  await prisma.marketQuote.upsert({
    where: { pairId: pair.id },
    create: { pairId: pair.id, bid: '1.09990000', ask: '1.10010000', last: '1.10000000', source: 'isolated-test-fixture', fetchedAt: now },
    update: { bid: '1.09990000', ask: '1.10010000', last: '1.10000000', source: 'isolated-test-fixture', fetchedAt: now },
  });

  const blockedLive = await request('/api/trades/orders', 'POST', {
    accountId: liveId, symbol: pair.symbol, side: 'BUY', type: 'MARKET', qty: 100, leverage: 1,
  });
  assert.equal(blockedLive.status, 409);
  assert.equal(blockedLive.body.error.code, 'LIVE_EXECUTION_UNAVAILABLE');

  const market = await request('/api/trades/orders', 'POST', {
    accountId: paperId, symbol: pair.symbol, side: 'BUY', type: 'MARKET', qty: 1000, leverage: 10,
  });
  assert.equal(market.status, 201, JSON.stringify(market.body));
  assert.equal(market.body.accountType, 'PAPER');
  assert.equal(market.body.executionMode, 'paper');
  assert.equal(market.body.filled, true);
  assert.equal(market.body.order.status, 'FILLED');

  const limit = await request('/api/trades/orders', 'POST', {
    accountId: paperId, symbol: pair.symbol, side: 'BUY', type: 'LIMIT', qty: 100, price: 1.11, leverage: 10,
  });
  assert.equal(limit.status, 201, JSON.stringify(limit.body));
  assert.equal(limit.body.filled, false);
  assert.equal(limit.body.order.status, 'OPEN');
  const matched = await matchRestingOrders(pair.symbol);
  assert.ok(matched.filled >= 1, 'worker matcher fills triggered practice limit orders');
  const filledLimit = await prisma.order.findUniqueOrThrow({ where: { id: limit.body.order.id } });
  assert.equal(filledLimit.status, 'FILLED');

  const spotPair = await prisma.tradingPair.findUniqueOrThrow({ where: { symbol: 'BTC/USDT' } });
  const spotNow = new Date();
  await prisma.marketQuote.upsert({
    where: { pairId: spotPair.id },
    create: { pairId: spotPair.id, bid: '50000.00000000', ask: '50010.00000000', last: '50005.00000000', source: 'isolated-test-fixture', fetchedAt: spotNow },
    update: { bid: '50000.00000000', ask: '50010.00000000', last: '50005.00000000', source: 'isolated-test-fixture', fetchedAt: spotNow },
  });
  const spotLimit = await request('/api/trades/orders', 'POST', {
    accountId: paperId, symbol: spotPair.symbol, side: 'BUY', type: 'LIMIT', qty: 0.001, price: 51000, leverage: 1,
  });
  assert.equal(spotLimit.status, 201, JSON.stringify(spotLimit.body));
  const spotMatched = await matchRestingOrders(spotPair.symbol);
  assert.equal(spotMatched.filled, 1);
  const spotHolding = await prisma.holding.findUniqueOrThrow({ where: { walletId_asset: { walletId: (await prisma.wallet.findUniqueOrThrow({ where: { accountId: paperId } })).id, asset: 'BTC' } } });
  assert.equal(Number(spotHolding.amount), 0.001);

  const positions = await request(`/api/trades/positions?accountId=${paperId}`);
  assert.equal(positions.status, 200, JSON.stringify(positions.body));
  assert.equal(positions.body.account.type, 'PAPER');
  assert.equal(positions.body.positions.length, 1, 'same-side practice fills net into a position');
  const positionId = positions.body.positions[0].id as string;

  const protection = await request(`/api/trades/positions/${positionId}`, 'PATCH', { takeProfit: 1.2, stopLoss: 1.0 });
  assert.equal(protection.status, 200, JSON.stringify(protection.body));
  assert.equal(protection.body.position.takeProfit, 1.2);
  assert.equal(protection.body.position.stopLoss, 1.0);

  const fills = await request(`/api/trades/history?accountId=${paperId}`);
  assert.equal(fills.status, 200);
  assert.equal(fills.body.executions.length, 3);
  assert.ok(fills.body.executions.every((fill: { venue: string }) => fill.venue === 'paper-simulation'));

  const waiting = await request('/api/trades/orders', 'POST', {
    accountId: paperId, symbol: pair.symbol, side: 'BUY', type: 'LIMIT', qty: 100, price: 0.5, leverage: 10,
  });
  assert.equal(waiting.status, 201);
  const cancelled = await request(`/api/trades/orders/${waiting.body.order.id}`, 'DELETE');
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.body.order.status, 'CANCELLED');

  const closed = await request(`/api/trades/positions/${positionId}`, 'DELETE');
  assert.equal(closed.status, 200, JSON.stringify(closed.body));
  assert.equal(closed.body.fullyClosed, true);
  const finalPositions = await request(`/api/trades/positions?accountId=${paperId}`);
  assert.equal(finalPositions.body.positions.length, 0);

  const finalWallet = await prisma.wallet.findUniqueOrThrow({ where: { accountId: paperId } });
  assert.ok(Number(finalWallet.available) > 0);
  const capital = await prisma.ledgerTransaction.findUnique({ where: { reference: `paper-capital:${paperId}` }, include: { entries: true } });
  assert.ok(capital);
  assert.equal(capital.entries.length, 2);
  assert.equal(capital.entries[0].amount.toString(), capital.entries[1].amount.toString());
  console.log('PASS: isolated paper account provisioning, virtual capital, live-account block, market fills, limit matching, persisted executions, position netting, TP/SL updates, cancellation, close and balanced ledger.');
}

main().catch(err => { console.error(err); process.exitCode = 1; }).finally(() => prisma.$disconnect());
