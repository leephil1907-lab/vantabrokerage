import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { getAccountForUser } from '@/lib/accounts';
import { revaluePositions } from '@/lib/risk';
import { d } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const account = await getAccountForUser(user.id, url.searchParams.get('accountId') ?? undefined);
    const status = url.searchParams.get('status') === 'closed' ? 'CLOSED' : 'OPEN';
    if (status === 'OPEN') await revaluePositions(account.id);
    const positions = await prisma.position.findMany({ where: { accountId: account.id, status }, orderBy: { createdAt: 'desc' }, take: 200 });
    return json({
      account: { id: account.id, type: account.type },
      positions: positions.map((p) => ({
        id: p.id, symbol: p.symbol, category: p.category, side: p.side, qty: d(p.qty), entryPrice: d(p.entryPrice),
        markPrice: p.markPrice != null ? d(p.markPrice) : null, leverage: p.leverage, marginMode: p.marginMode,
        initialMargin: d(p.initialMargin), liquidationPrice: p.liquidationPrice != null ? d(p.liquidationPrice) : null,
        takeProfit: p.takeProfit != null ? d(p.takeProfit) : null, stopLoss: p.stopLoss != null ? d(p.stopLoss) : null,
        unrealizedPnl: d(p.unrealizedPnl), realizedPnl: d(p.realizedPnl), fundingPaid: d(p.fundingPaid),
        status: p.status, openedAt: p.createdAt.toISOString(), closedAt: p.closedAt?.toISOString() ?? null,
      })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return fail(err);
  }
}
