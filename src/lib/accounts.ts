import { prisma } from './db';
import { AppError } from './errors';
import { d, money } from './ledger';
import type { Account } from '@prisma/client';

export const STARTING_PAPER_BALANCE = Number(process.env.PAPER_STARTING_BALANCE ?? 100000);

export async function ensureAccounts(userId: string) {
  const existing = await prisma.account.findMany({ where: { userId }, include: { wallet: true } });
  const haveLive = existing.some((a) => a.type === 'LIVE');
  const havePaper = existing.some((a) => a.type === 'PAPER');
  if (!haveLive) {
    const live = await prisma.account.create({
      data: {
        userId,
        type: 'LIVE',
        currency: 'USD',
        isDefault: false,
        leverage: 100,
        wallet: { create: { currency: 'USD', available: '0', locked: '0' } },
      },
      include: { wallet: true },
    });
    existing.push(live);
  }
  if (!havePaper) {
    const paper = await prisma.account.create({
      data: {
        userId,
        type: 'PAPER',
        currency: 'USD',
        isDefault: true,
        leverage: 100,
        wallet: { create: { currency: 'USD', available: money(STARTING_PAPER_BALANCE), locked: '0' } },
      },
      include: { wallet: true },
    });
    existing.push(paper);
  }
  await prisma.account.updateMany({ where: { userId, type: 'LIVE' }, data: { isDefault: false } });
  await prisma.account.updateMany({ where: { userId, type: 'PAPER' }, data: { isDefault: true } });
  await prisma.account.updateMany({ where: { userId, type: 'LIVE' }, data: { isDefault: false } });
  await prisma.account.updateMany({ where: { userId, type: 'PAPER' }, data: { isDefault: true } });
  return existing;
}

export async function getAccountForUser(userId: string, accountId?: string) {
  await ensureAccounts(userId);
  const where = accountId ? { id: accountId, userId } : { userId, type: 'PAPER' as const };
  const account = await prisma.account.findFirst({ where, include: { wallet: { include: { holdings: true } } } });
  if (!account) {
    const fallback = await prisma.account.findFirst({ where: { userId }, include: { wallet: { include: { holdings: true } } }, orderBy: { type: 'asc' } });
    if (!fallback) throw new AppError('NOT_FOUND', 'No trading account available.', 404);
    return fallback;
  }
  return account;
}

export function accountSummary(account: Account & { wallet: { available: unknown; locked: unknown } | null }) {
  return {
    id: account.id,
    type: account.type,
    status: account.status,
    currency: account.currency,
    leverage: account.leverage,
    isDefault: account.isDefault,
    available: d(account.wallet?.available as never),
    locked: d(account.wallet?.locked as never),
  };
}

export async function accountEquity(accountId: string) {
  const wallet = await prisma.wallet.findUnique({ where: { accountId } });
  const positions = await prisma.position.findMany({ where: { accountId, status: 'OPEN' } });
  const openBinary = await prisma.binaryTrade.findMany({ where: { accountId, result: 'OPEN' } });
  const available = d(wallet?.available as never);
  const locked = d(wallet?.locked as never);
  const unrealized = positions.reduce((s, p) => s + d(p.unrealizedPnl), 0);
  const realized = positions.reduce((s, p) => s + d(p.realizedPnl), 0);
  const binaryAtRisk = openBinary.reduce((s, t) => s + d(t.stake), 0);
  return {
    available,
    locked,
    unrealizedPnl: unrealized,
    realizedPnl: realized,
    binaryAtRisk,
    marginUsed: positions.reduce((s, p) => s + d(p.initialMargin), 0),
    equity: available + locked + unrealized,
  };
}
