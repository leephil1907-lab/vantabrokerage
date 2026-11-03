/**
 * Market refresh and isolated PAPER-account processing worker. LIVE trading remains blocked;
 * historical records are left unchanged. Run with: npm run worker.
 */
import { prisma } from '../lib/db';
import { listMarkets } from '../lib/markets';
import { matchRestingOrders } from '../lib/execution';
import { revaluePositions, runLiquidationEngine, runProtectiveExitEngine } from '../lib/risk';
import { settleExpiredBinaryTrades } from '../lib/binary';

/** Evaluate untriggered price alerts against the freshest quotes; notify once. */
async function checkPriceAlerts() {
  const open = await prisma.priceAlert.findMany({ where: { triggered: false }, take: 200 });
  if (!open.length) return { checked: 0, triggered: 0 };
  const symbols = [...new Set(open.map((a) => a.symbol))];
  const rows = await listMarkets({ symbols });
  const mark = new Map(rows.map((r) => [r.symbol, r.last]));
  let triggered = 0;
  for (const alert of open) {
    const last = mark.get(alert.symbol);
    if (last == null) continue;
    const threshold = Number(alert.threshold);
    const hit = alert.direction === 'ABOVE' ? last >= threshold : last <= threshold;
    if (!hit) continue;
    await prisma.$transaction([
      prisma.priceAlert.update({ where: { id: alert.id }, data: { triggered: true, triggeredAt: new Date() } }),
      prisma.notification.create({
        data: {
          userId: alert.userId,
          type: 'TRADE',
          title: `Price alert: ${alert.symbol}`,
          body: `${alert.symbol} traded at ${last} — ${alert.direction === 'ABOVE' ? 'above' : 'below'} your ${threshold} alert.`,
        },
      }),
    ]);
    triggered++;
  }
  return { checked: open.length, triggered };
}

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
  if (state.quoteTick % 2 === 0) await record('alerts.check', checkPriceAlerts);
  if (state.quoteTick % 2 === 0) {
    await record('paper.positions.revalue', async () => ({ positions: (await revaluePositions()).length }));
    await record('paper.positions.protective-exits', async () => ({ closed: (await runProtectiveExitEngine()).length }));
    await record('paper.positions.liquidations', async () => ({ liquidated: (await runLiquidationEngine()).length }));
  }
}

async function main() {
  console.log('[worker] PRIMEVEST market and practice-trading worker starting…');
  let running = true;
  let inFlightTick: Promise<void> | null = null;

  const shutdown = async (signal: string) => {
    if (!running) return;
    console.log(`[worker] received ${signal}; draining the current tick before shutdown`);
    running = false;
    if (inFlightTick) {
      try {
        await inFlightTick;
      } catch (err) {
        console.error('[worker] in-flight tick failed during shutdown', err);
      }
    }
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  while (running) {
    const started = Date.now();
    inFlightTick = tick();
    await inFlightTick;
    inFlightTick = null;
    const elapsed = Date.now() - started;
    if (running) await new Promise((r) => setTimeout(r, Math.max(1000, 5000 - elapsed)));
  }
}

main().catch(async (err) => {
  console.error('[worker] fatal', err);
  await prisma.$disconnect();
  process.exit(1);
});
