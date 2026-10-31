/**
 * VANTA Markets background worker.
 *
 * Runs the time-driven parts of the platform:
 *  - resting order matching against live quotes
 *  - position revaluation + liquidation engine
 *  - take-profit / stop-loss execution
 *  - short-expiry settlement
 *  - funding settlement for perpetuals
 *  - market quote refresh for the catalogue
 *  - email outbox flush (when a provider is configured)
 *
 * Run with:  npm run worker
 */
import { prisma } from '../lib/db';
import { matchRestingOrders } from '../lib/execution';
import { runLiquidationEngine, runProtectiveExitEngine, settleFunding } from '../lib/risk';
import { settleExpiredBinaryTrades } from '../lib/binary';
import { listMarkets } from '../lib/markets';

const state = { fundingTick: 0, quoteTick: 0 };

async function record(name: string, fn: () => Promise<unknown>) {
  const run = await prisma.jobRun.create({ data: { name, status: 'RUNNING' } });
  const started = Date.now();
  try {
    const result = await fn();
    await prisma.jobRun.update({
      where: { id: run.id },
      data: { status: 'OK', detail: JSON.stringify(result).slice(0, 1000), finishedAt: new Date() },
    });
    if (process.env.WORKER_VERBOSE) console.log(`[worker] ${name} ok in ${Date.now() - started}ms`);
  } catch (err) {
    console.error(`[worker] ${name} failed`, err);
    await prisma.jobRun.update({ where: { id: run.id }, data: { status: 'FAILED', detail: String(err).slice(0, 1000), finishedAt: new Date() } });
  }
}

async function tick() {
  await record('orders.match', () => matchRestingOrders());
  await record('binary.settle', () => settleExpiredBinaryTrades().then((r) => ({ settled: r.length })));
  await record('positions.protect', () => runProtectiveExitEngine().then((r) => ({ closed: r.length })));
  await record('positions.liquidate', () => runLiquidationEngine().then((r) => ({ liquidated: r.length })));

  state.quoteTick++;
  if (state.quoteTick % 3 === 0) await record('markets.refresh', async () => { const r = await listMarkets({ refresh: true }); return { pairs: r.length }; });

  state.fundingTick++;
  if (state.fundingTick % 240 === 0) await record('funding.settle', () => settleFunding());
}

async function main() {
  console.log('[worker] VANTA Markets worker starting…');
  let running = true;
  const shutdown = async (signal: string) => {
    console.log(`[worker] received ${signal}, shutting down`);
    running = false;
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  while (running) {
    const started = Date.now();
    await tick();
    const elapsed = Date.now() - started;
    await new Promise((r) => setTimeout(r, Math.max(1000, 5000 - elapsed)));
  }
}

main().catch(async (err) => {
  console.error('[worker] fatal', err);
  await prisma.$disconnect();
  process.exit(1);
});
