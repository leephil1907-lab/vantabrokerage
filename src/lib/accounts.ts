import { prisma } from './db';
import { AppError } from './errors';
import { d } from './ledger';
import type { Account } from '@prisma/client';

/** New accounts have a single customer account; historical records are preserved. */
export async function ensureAccounts(userId: string) {
  const live = await prisma.account.upsert({
    where: { userId_type: { userId, type: 'LIVE' } },
    create: { userId, type: 'LIVE', currency: 'USD', isDefault: true, leverage: 100, wallet: { create: { currency: 'USD', available: '0', locked: '0' } } },
    update: {},
    include: { wallet: true },
  });
  return [live];
}

export async function getAccountForUser(userId: string, accountId?: string) {
  await ensureAccounts(userId);
  const account = await prisma.account.findFirst({
    where: { userId, type: 'LIVE', ...(accountId ? { id: accountId } : {}) },
    include: { wallet: { include: { holdings: true } } },
  });
  if (!account) throw new AppError('NOT_FOUND', 'Account not found.', 404);
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
