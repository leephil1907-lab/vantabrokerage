import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { getAccountForUser } from '@/lib/accounts';
import { d } from '@/lib/ledger';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const account = await getAccountForUser(user.id, url.searchParams.get('accountId') ?? undefined, { allowPaper: true });
    const [closed, fills, binary, funding, liquidations] = await Promise.all([
      prisma.position.findMany({ where: { accountId: account.id, status: 'CLOSED' }, orderBy: { closedAt: 'desc' }, take: 100 }),
      prisma.execution.findMany({ where: { order: { accountId: account.id } }, include: { order: true }, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.binaryTrade.findMany({ where: { accountId: account.id, result: { not: 'OPEN' } }, orderBy: { settledAt: 'desc' }, take: 100 }),
      prisma.fundingPayment.findMany({ where: { accountId: account.id }, orderBy: { fundingTime: 'desc' }, take: 50 }),
      prisma.liquidationEvent.findMany({ where: { accountId: account.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    return json({
      closedPositions: closed.map((p) => ({
        id: p.id, symbol: p.symbol, side: p.side, qty: d(p.qty), entryPrice: d(p.entryPrice), exitPrice: p.markPrice != null ? d(p.markPrice) : null,
        realizedPnl: d(p.realizedPnl), feesPaid: d(p.feesPaid), leverage: p.leverage, openedAt: p.createdAt.toISOString(), closedAt: p.closedAt?.toISOString() ?? null,
      })),
      executions: fills.map((f) => ({
        id: f.id, symbol: f.order.symbol, side: f.order.side, qty: d(f.qty), price: d(f.price), fee: d(f.fee), venue: f.venue,
        quoteTs: f.quoteTs.toISOString(), createdAt: f.createdAt.toISOString(),
      })),
      binaryTrades: binary.map((b) => ({
        id: b.id, symbol: b.symbol, direction: b.direction, stake: d(b.stake), payoutRate: d(b.payoutRate), entryPrice: d(b.entryPrice),
        settlePrice: b.settlePrice != null ? d(b.settlePrice) : null, result: b.result, pnl: d(b.pnl), env: b.env,
        expiresAt: b.expiresAt.toISOString(), settledAt: b.settledAt?.toISOString() ?? null, entryQuoteTs: b.entryQuoteTs.toISOString(), exitQuoteTs: b.exitQuoteTs?.toISOString() ?? null,
      })),
      funding: funding.map((f) => ({ id: f.id, symbol: f.symbol, rate: d(f.rate), amount: d(f.amount), markPrice: d(f.markPrice), fundingTime: f.fundingTime.toISOString() })),
      liquidations: liquidations.map((l) => ({ id: l.id, symbol: l.symbol, side: l.side, qty: d(l.qty), price: d(l.price), bankruptPrice: d(l.bankruptPrice), lossAmount: d(l.lossAmount), createdAt: l.createdAt.toISOString() })),
    });
  } catch (err) {
    return fail(err);
  }
}
