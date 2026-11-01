/**
 * Market refresh and isolated PAPER-account processing worker. LIVE trading remains blocked;
 * historical records are left unchanged. Run with: npm run worker.
 */
import { prisma } from '../lib/db';
import { listMarkets } from '../lib/markets';
import { matchRestingOrders } from '../lib/execution';
import { revaluePositions, runLiquidationEngine, runProtectiveExitEngine } from '../lib/risk';
import { settleExpiredBinaryTrades } from '../lib/binary';

const state = { quoteTick: 0 };

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
  state.quoteTick++;
  if (state.quoteTick % 3 === 0) await record('markets.refresh', async () => { const r = await listMarkets({ refresh: true }); return { pairs: r.length }; });
  await record('paper.orders.match', async () => ({ filled: await matchRestingOrders() }));
  await record('binary.settle', async () => ({ settled: (await settleExpiredBinaryTrades()).length }));
  if (state.quoteTick % 2 === 0) {
    await record('paper.positions.revalue', async () => ({ positions: (await revaluePositions()).length }));
    await record('paper.positions.protective-exits', async () => ({ closed: (await runProtectiveExitEngine()).length }));
    await record('paper.positions.liquidations', async () => ({ liquidated: (await runLiquidationEngine()).length }));
  }
}

async function main() {
  console.log('[worker] PRIMEVEST market and practice-trading worker starting…');
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
