import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireStaff } from '@/lib/auth';
import { d } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const [orders, positions, liquidations, binaryOpen] = await Promise.all([
      prisma.order.findMany({ where: status && status !== 'ALL' ? { status: status as never } : {}, orderBy: { createdAt: 'desc' }, take: 100, include: { fills: true, account: { include: { user: { select: { email: true } } } } } }),
      prisma.position.findMany({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' }, take: 100, include: { account: { include: { user: { select: { email: true } } } } } }),
      prisma.liquidationEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.binaryTrade.findMany({ where: { result: 'OPEN' }, take: 100 }),
    ]);
    const exposure = positions.reduce((s, p) => s + d(p.markPrice ?? p.entryPrice) * d(p.qty), 0);
    return json({
      exposure,
      openBinary: binaryOpen.length,
      orders: orders.map((o) => ({
        id: o.id, email: o.account.user.email, accountType: o.account.type, symbol: o.symbol, side: o.side, type: o.type, status: o.status,
        qty: d(o.qty), price: o.price != null ? d(o.price) : null, avgFillPrice: o.avgFillPrice != null ? d(o.avgFillPrice) : null,
        leverage: o.leverage, fee: d(o.fee), rejectReason: o.rejectReason, fills: o.fills.length, createdAt: o.createdAt.toISOString(),
      })),
      positions: positions.map((p) => ({
        id: p.id, email: p.account.user.email, symbol: p.symbol, side: p.side, qty: d(p.qty), entryPrice: d(p.entryPrice),
        markPrice: p.markPrice != null ? d(p.markPrice) : null, leverage: p.leverage, unrealizedPnl: d(p.unrealizedPnl), createdAt: p.createdAt.toISOString(),
      })),
      liquidations: liquidations.map((l) => ({ id: l.id, symbol: l.symbol, side: l.side, qty: d(l.qty), price: d(l.price), lossAmount: d(l.lossAmount), createdAt: l.createdAt.toISOString() })),
    });
  } catch (err) {
    return fail(err);
  }
}
