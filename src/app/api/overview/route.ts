import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { ensureAccounts, accountEquity, getAccountForUser } from '@/lib/accounts';
import { listMarkets } from '@/lib/markets';
import { d } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    await ensureAccounts(user.id);
    const url = new URL(req.url);
    const account = await getAccountForUser(user.id, url.searchParams.get('accountId') ?? undefined);

    const [accounts, positions, orders, entries, watch, notifCount, dbUser, binaryOpen] = await Promise.all([
      prisma.account.findMany({ where: { userId: user.id, type: 'LIVE' }, include: { wallet: true } }),
      prisma.position.findMany({ where: { accountId: account.id, status: 'OPEN' }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.order.findMany({ where: { accountId: account.id, status: 'OPEN' }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.ledgerEntry.findMany({ where: { wallet: { accountId: account.id } }, include: { transaction: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.watchlistItem.findMany({ where: { userId: user.id }, take: 12 }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
      prisma.user.findUnique({ where: { id: user.id }, include: { kyc: true, profile: true } }),
      prisma.binaryTrade.findMany({ where: { accountId: account.id, result: 'OPEN' } }),
    ]);

    const equity = await accountEquity(account.id);
    const symbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAUUSD', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', ...(watch.map((w) => w.symbol))];
    const markets = await listMarkets({ symbols: [...new Set(symbols)] });

    return json({
      profile: { firstName: dbUser?.profile?.firstName ?? null, lastName: dbUser?.profile?.lastName ?? null, email: dbUser?.email, kycStatus: dbUser?.kyc?.status ?? 'NOT_SUBMITTED', emailVerified: !!dbUser?.emailVerifiedAt },
      accounts: await Promise.all(accounts.map(async (a) => ({ id: a.id, type: a.type, available: d(a.wallet?.available as never), locked: d(a.wallet?.locked as never), isDefault: a.isDefault, equity: await accountEquity(a.id) }))),
      activeAccount: { id: account.id, type: account.type },
      equity,
      openPositions: positions.map((p) => ({
        id: p.id, symbol: p.symbol, side: p.side, qty: d(p.qty), entryPrice: d(p.entryPrice), markPrice: p.markPrice != null ? d(p.markPrice) : null,
        unrealizedPnl: d(p.unrealizedPnl), leverage: p.leverage, margin: d(p.initialMargin), liquidationPrice: p.liquidationPrice != null ? d(p.liquidationPrice) : null,
      })),
      openOrders: orders.map((o) => ({ id: o.id, symbol: o.symbol, side: o.side, type: o.type, qty: d(o.qty), price: o.price != null ? d(o.price) : null, status: o.status, createdAt: o.createdAt.toISOString() })),
      openBinary: binaryOpen.map((b) => ({ id: b.id, symbol: b.symbol, direction: b.direction, stake: d(b.stake), entryPrice: d(b.entryPrice), expiresAt: b.expiresAt.toISOString(), env: b.env })),
      recentTransactions: entries.map((e) => ({
        id: e.id, direction: e.direction, amount: d(e.amount), type: e.transaction.type, description: e.transaction.description, createdAt: e.createdAt.toISOString(),
      })),
      markets: markets.slice(0, 14),
      unreadNotifications: notifCount,
      executionMode: 'unavailable',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return fail(err);
  }
}
