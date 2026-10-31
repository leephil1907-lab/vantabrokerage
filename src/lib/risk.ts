import { prisma } from './db';
import { getQuote } from './market-data';
import { d, postLedger, round, money, getOrCreateWallet, unlockFunds } from './ledger';
import { pnlUsd, liquidationPrice } from './execution';

const MAINTENANCE_RATE = 0.005;
const LIQUIDATION_THRESHOLD = 0.5; // margin ratio below this triggers liquidation
const WARNING_THRESHOLD = 0.8;

export type PositionValuation = {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  qty: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  roe: number;
  liquidationPrice: number | null;
  marginRatio: number;
};

/**
 * Re-value open derivative positions against live quotes, refresh mark prices and
 * unrealized PnL in the database. Returns per-position valuations.
 */
export async function revaluePositions(accountId?: string): Promise<PositionValuation[]> {
  const positions = await prisma.position.findMany({
    where: { status: 'OPEN', ...(accountId ? { accountId } : {}) },
    include: { account: true },
    take: 500,
  });
  const out: PositionValuation[] = [];
  for (const pos of positions) {
    try {
      const pair = await prisma.tradingPair.findUnique({ where: { id: pos.pairId } });
      if (!pair) continue;
      const quote = await getQuote(pair.id, 5000);
      const mark = pos.side === 'LONG' ? quote.bid : quote.ask;
      const pnl = pnlUsd(pair, pos.side, d(pos.entryPrice), mark, d(pos.qty));
      const margin = d(pos.initialMargin);
      const notional = mark * d(pos.qty);
      const maintenance = notional * MAINTENANCE_RATE;
      const marginRatio = margin > 0 ? Math.max(0, (margin + pnl) / maintenance) : 0;
      const valuation: PositionValuation = {
        id: pos.id,
        symbol: pos.symbol,
        side: pos.side,
        qty: d(pos.qty),
        entryPrice: d(pos.entryPrice),
        markPrice: round(mark, 8),
        leverage: pos.leverage,
        margin,
        unrealizedPnl: round(pnl, 10),
        roe: margin > 0 ? round((pnl / margin) * 100, 4) : 0,
        liquidationPrice: pos.liquidationPrice ? d(pos.liquidationPrice) : liquidationPrice(pos.side, d(pos.entryPrice), pos.leverage),
        marginRatio: round(marginRatio, 6),
      };
      out.push(valuation);
      await prisma.position.update({ where: { id: pos.id }, data: { markPrice: String(valuation.markPrice), unrealizedPnl: money(valuation.unrealizedPnl) } });
      if (marginRatio < WARNING_THRESHOLD && marginRatio >= LIQUIDATION_THRESHOLD) {
        const recent = await prisma.marginRecord.findFirst({ where: { positionId: pos.id, createdAt: { gte: new Date(Date.now() - 15 * 60_000) } } });
        if (!recent) {
          await prisma.marginRecord.create({
            data: { accountId: pos.accountId, positionId: pos.id, symbol: pos.symbol, ratio: marginRatio.toFixed(6), status: 'WARNING', equity: money(margin + pnl), maintenance: money(maintenance) },
          });
          await prisma.notification.create({
            data: { userId: pos.account.userId, type: 'TRADE', title: 'Margin warning', body: `${pos.symbol} margin ratio is ${(marginRatio * 100).toFixed(0)}% of maintenance requirement. Add margin or reduce exposure.` },
          });
        }
      }
    } catch (err) {
      console.error('[revaluePositions]', pos.id, err);
    }
  }
  return out;
}

/** Force-close any position whose margin ratio has fallen below the liquidation threshold. */
export async function runLiquidationEngine() {
  const valuations = await revaluePositions();
  const events: { positionId: string; symbol: string; loss: number }[] = [];
  for (const v of valuations) {
    if (v.marginRatio > LIQUIDATION_THRESHOLD) continue;
    const pos = await prisma.position.findUnique({ where: { id: v.id }, include: { account: true } });
    if (!pos || pos.status !== 'OPEN') continue;
    const loss = Math.max(0, -v.unrealizedPnl);
    const recoverable = Math.min(loss, d(pos.initialMargin));
    await prisma.$transaction(async (tx) => {
      const wallet = await getOrCreateWallet(tx, pos.accountId, pos.account.currency);
      await unlockFunds(tx, wallet.id, d(pos.initialMargin));
      const remainingLoss = round(Math.min(recoverable, d(pos.initialMargin)), 10);
      if (remainingLoss > 0) {
        await postLedger(tx, {
          type: 'LIQUIDATION',
          walletId: wallet.id,
          amount: remainingLoss,
          direction: 'DEBIT',
          description: `Liquidated ${pos.symbol} ${pos.side} at ${v.markPrice}`,
          reference: `liq:${pos.id}`,
          metadata: { markPrice: v.markPrice, marginRatio: v.marginRatio },
        });
      }
      await tx.position.update({
        where: { id: pos.id },
        data: { status: 'CLOSED', closedAt: new Date(), realizedPnl: money(d(pos.realizedPnl) + v.unrealizedPnl), unrealizedPnl: '0', markPrice: String(v.markPrice) },
      });
      await tx.liquidationEvent.create({
        data: {
          positionId: pos.id,
          accountId: pos.accountId,
          symbol: pos.symbol,
          side: pos.side,
          qty: String(d(pos.qty)),
          price: String(v.markPrice),
          bankruptPrice: String(round(d(pos.entryPrice) * (pos.side === 'LONG' ? 1 - 1 / pos.leverage : 1 + 1 / pos.leverage), 8)),
          lossAmount: money(remainingLoss),
        },
      });
      await tx.marginRecord.create({
        data: { accountId: pos.accountId, positionId: pos.id, symbol: pos.symbol, ratio: v.marginRatio.toFixed(6), status: 'LIQUIDATED', equity: money(v.margin + v.unrealizedPnl), maintenance: money(v.markPrice * v.qty * MAINTENANCE_RATE) },
      });
      await tx.notification.create({
        data: { userId: pos.account.userId, type: 'TRADE', title: 'Position liquidated', body: `${pos.symbol} ${pos.side} was liquidated at ${v.markPrice}. Margin ratio fell below the maintenance requirement.` },
      });
    });
    events.push({ positionId: pos.id, symbol: pos.symbol, loss: recoverable });
  }
  return events;
}

/** Evaluate TP/SL triggers against live marks. */
export async function runProtectiveExitEngine() {
  const positions = await prisma.position.findMany({ where: { status: 'OPEN', OR: [{ takeProfit: { not: null } }, { stopLoss: { not: null } }] } });
  const closed: string[] = [];
  for (const pos of positions) {
    const pair = await prisma.tradingPair.findUnique({ where: { id: pos.pairId } });
    if (!pair) continue;
    const quote = await getQuote(pair.id, 4000);
    const mark = pos.side === 'LONG' ? quote.bid : quote.ask;
    const tp = pos.takeProfit ? d(pos.takeProfit) : null;
    const sl = pos.stopLoss ? d(pos.stopLoss) : null;
    const hitTp = tp !== null && (pos.side === 'LONG' ? mark >= tp : mark <= tp);
    const hitSl = sl !== null && (pos.side === 'LONG' ? mark <= sl : mark >= sl);
    if (hitTp || hitSl) {
      const { closePosition } = await import('./execution');
      await closePosition({ userId: pos.accountId ? (await prisma.account.findUnique({ where: { id: pos.accountId } }))!.userId : '', positionId: pos.id, reason: hitTp ? 'take-profit' : 'stop-loss' });
      closed.push(pos.id);
    }
  }
  return closed;
}

/** Periodic funding settlement for perpetual futures positions. */
export async function settleFunding() {
  const pairs = await prisma.tradingPair.findMany({ where: { category: 'FUTURES', enabled: true } });
  const results: { symbol: string; payments: number }[] = [];
  for (const pair of pairs) {
    const positions = await prisma.position.findMany({ where: { symbol: pair.symbol, status: 'OPEN' } });
    if (!positions.length) continue;
    const quote = await getQuote(pair.id, 5000);
    // Funding rate derived from premium of mark over 24h reference; bounded to ±0.03%/8h.
    const change = (quote.change24h ?? 0) / 100;
    const rate = round(Math.max(-0.0003, Math.min(0.0003, change / 100)), 8);
    for (const pos of positions) {
      const notional = quote.last * d(pos.qty);
      const amount = round(notional * rate * (pos.side === 'LONG' ? 1 : -1), 10);
      if (Math.abs(amount) < 1e-8) continue;
      await prisma.$transaction(async (tx) => {
        const account = await tx.account.findUnique({ where: { id: pos.accountId } });
        if (!account) return;
        const wallet = await getOrCreateWallet(tx, pos.accountId, account.currency);
        try {
          await postLedger(tx, {
            type: 'FUNDING',
            walletId: wallet.id,
            amount: Math.abs(amount),
            direction: amount >= 0 ? 'CREDIT' : 'DEBIT',
            description: `Funding ${amount >= 0 ? 'received' : 'paid'} · ${pos.symbol}`,
            reference: `funding:${pos.id}:${Date.now()}`,
          });
        } catch {
          return;
        }
        await tx.fundingPayment.create({
          data: { positionId: pos.id, accountId: pos.accountId, symbol: pos.symbol, rate: rate.toString(), amount: money(amount), markPrice: String(round(quote.last, 8)), fundingTime: new Date() },
        });
        await tx.position.update({ where: { id: pos.id }, data: { fundingPaid: money(d(pos.fundingPaid) + amount) } });
      });
    }
    results.push({ symbol: pair.symbol, payments: positions.length });
  }
  return results;
}
