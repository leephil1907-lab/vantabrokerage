import { prisma } from './db';
import { AppError } from './errors';
import { d, postLedger } from './ledger';
import type { Account } from '@prisma/client';

/** New accounts have a single customer account; historical records are preserved. */
export async function ensureAccounts(userId: string) {
  const live = await prisma.account.upsert({
    where: { userId_type: { userId, type: 'LIVE' } },
    create: { userId, type: 'LIVE', currency: 'USD', isDefault: true, leverage: 100, wallet: { create: { currency: 'USD', available: '0', locked: '0' } } },
    update: {},
    include: { wallet: true },
  });
  // A live account always starts at zero. The labelled virtual starting
  // capital lives on the demo (paper) account, which is provisioned too.
  const paper = await prisma.account.upsert({
    where: { userId_type: { userId, type: 'PAPER' } },
    create: { userId, type: 'PAPER', currency: 'USD', isDefault: false, leverage: 100, wallet: { create: { currency: 'USD', available: '0', locked: '0' } } },
    update: {},
    include: { wallet: true },
  });
  await grantVirtualCapital(paper.id);
  return [live, paper];
}

/** Starting trading capital for accounts with no funding history.
 *  Real deposit rails are not connected, so every unfunded account is
 *  provisioned with clearly-labelled virtual capital through the ledger.
 *  Idempotent: only accounts with an empty wallet and no ledger history qualify. */
export const VIRTUAL_STARTING_BALANCE = 100_000;
export async function grantVirtualCapital(accountId: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId }, include: { wallet: { include: { holdings: true } } } });
  if (!account?.wallet) return false;
  const wallet = account.wallet;
  if (d(wallet.available) !== 0 || d(wallet.locked) !== 0) return false;
  if (wallet.holdings.some((h) => d(h.amount) !== 0)) return false;
  const existing = await prisma.ledgerEntry.findFirst({ where: { walletId: wallet.id } });
  if (existing) return false;
  const already = await prisma.ledgerTransaction.findFirst({ where: { reference: `virtual-capital:${accountId}` } });
  if (already) return false;
  await postLedger(prisma, {
    type: 'BONUS',
    walletId: wallet.id,
    amount: VIRTUAL_STARTING_BALANCE,
    direction: 'CREDIT',
    description: 'Virtual trading capital — no cash value (real funding not connected)',
    reference: `virtual-capital:${accountId}`,
    systemAccount: 'VIRTUAL_CAPITAL',
    metadata: { cashValue: 0, purpose: 'internal-dealing-starting-capital' },
  });
  return true;
}

export async function getAccountForUser(userId: string, accountId?: string, opts: { allowPaper?: boolean } = {}) {
  await ensureAccounts(userId);
  const account = await prisma.account.findFirst({
    where: { userId, type: opts.allowPaper ? { in: ['LIVE', 'PAPER'] } : 'LIVE', ...(accountId ? { id: accountId } : {}) },
    orderBy: { type: 'desc' }, // PAPER first: the funded demo workspace is the default view
    include: { wallet: { include: { holdings: true } } },
  });
  if (!account) throw new AppError('NOT_FOUND', 'Account not found.', 404);
  return account;
}

/** Create an explicitly simulated account with a virtual, non-cash starting balance. */
export async function createPaperAccount(userId: string) {
  await ensureAccounts(userId);
  const existing = await prisma.account.findUnique({ where: { userId_type: { userId, type: 'PAPER' } }, include: { wallet: true } });
  if (existing) return existing;
  try {
    return await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: { userId, type: 'PAPER', currency: 'USD', leverage: 100, isDefault: false, wallet: { create: { currency: 'USD', available: '0', locked: '0' } } },
        include: { wallet: true },
      });
      if (!account.wallet) throw new Error('Practice wallet could not be created.');
      await postLedger(tx, {
        type: 'BONUS', walletId: account.wallet.id, amount: 100000, direction: 'CREDIT',
        description: 'Virtual practice starting balance — no cash value',
        reference: `paper-capital:${account.id}`, systemAccount: 'PAPER_CAPITAL',
        metadata: { environment: 'PAPER', cashValue: 0, purpose: 'practice-trading' },
      });
      return account;
    });
  } catch (error) {
    // Concurrent create requests are idempotent: return the account that won the unique-key race.
    const raced = await prisma.account.findUnique({ where: { userId_type: { userId, type: 'PAPER' } }, include: { wallet: true } });
    if (raced) return raced;
    throw error;
  }
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
