import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { getAccountForUser, accountEquity } from '@/lib/accounts';
import { listMarkets } from '@/lib/markets';
import { revaluePositions } from '@/lib/risk';
import { d } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const account = await getAccountForUser(user.id, url.searchParams.get('accountId') ?? undefined, { allowPaper: true });
    await revaluePositions(account.id);
    const wallet = await prisma.wallet.findUnique({ where: { accountId: account.id }, include: { holdings: true } });
    const positions = await prisma.position.findMany({ where: { accountId: account.id, status: 'OPEN' } });
    const equity = await accountEquity(account.id);
    const symbols = [...new Set([...positions.map((p) => p.symbol), ...(wallet?.holdings ?? []).map((h) => `${h.asset}/USDT`)])];
    const markets = symbols.length ? await listMarkets({ symbols }) : [];
    const priceOf = new Map(markets.map((m) => [m.symbol, m.last ?? 0]));
    const holdings = (wallet?.holdings ?? []).map((h) => {
      const price = priceOf.get(`${h.asset}/USDT`) ?? 0;
      return { asset: h.asset, amount: d(h.amount), price, valueUsd: d(h.amount) * price };
    });
    const positionsValue = positions.reduce((s, p) => s + d(p.markPrice) * d(p.qty) * (p.side === 'LONG' ? 1 : -1), 0);
    return json({
      account: { id: account.id, type: account.type },
      equity,
      holdings,
      positions: positions.map((p) => ({
        id: p.id, symbol: p.symbol, side: p.side, qty: d(p.qty), entryPrice: d(p.entryPrice), markPrice: p.markPrice != null ? d(p.markPrice) : null,
        unrealizedPnl: d(p.unrealizedPnl), leverage: p.leverage, margin: d(p.initialMargin),
      })),
      allocation: {
        cash: equity.available,
        marginLocked: equity.marginUsed,
        binaryAtRisk: equity.binaryAtRisk,
        assets: holdings.reduce((s, h) => s + h.valueUsd, 0),
        positionsGross: positionsValue,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return fail(err);
  }
}
