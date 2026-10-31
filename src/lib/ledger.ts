import { prisma } from './db';
import { AppError } from './errors';
import type { Prisma } from '@prisma/client';

type TxClient = Prisma.TransactionClient;

/** Decimal helpers — all money math is performed with strings→number on 10dp boundaries. */
export function d(v: Prisma.Decimal | number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return Number(v);
}

export function round(v: number, dp = 10): number {
  const f = Math.pow(10, dp);
  return Math.round((v + Number.EPSILON) * f) / f;
}

export function money(v: number): string {
  return round(v, 10).toFixed(10);
}

export async function getOrCreateWallet(tx: TxClient | typeof prisma, accountId: string, currency = 'USD') {
  const existing = await tx.wallet.findUnique({ where: { accountId } });
  if (existing) return existing;
  return tx.wallet.create({ data: { accountId, currency } });
}

/**
 * Post a balanced double-entry ledger transaction.
 * The ledger is the single source of truth for balances: system ledger account
 * `PLATFORM:<type>` is credited/debited as the counterparty, and the total of all
 * entries must net to zero.
 */
export async function postLedger(
  tx: TxClient,
  input: {
    type: Prisma.LedgerTransactionUncheckedCreateInput['type'];
    walletId: string;
    amount: number; // positive number; direction determines sign
    direction: 'DEBIT' | 'CREDIT';
    description?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
    systemAccount?: string; // counterparty key, default PLATFORM
    from?: 'available' | 'locked'; // bucket the customer leg reduces (DEBIT only)
  },
) {
  const amount = round(Math.abs(input.amount), 10);
  if (!isFinite(amount) || amount <= 0) throw new AppError('INVALID_AMOUNT', 'Ledger amount must be positive.', 400);
  const wallet = await tx.wallet.findUnique({ where: { id: input.walletId } });
  if (!wallet) throw new AppError('NOT_FOUND', 'Wallet not found', 404);

  const available = d(wallet.available);
  const locked = d(wallet.locked);
  let nextAvailable = available;
  let nextLocked = locked;
  const fromLocked = input.from === 'locked';
  if (input.direction === 'DEBIT') {
    if (fromLocked) {
      if (locked + 1e-9 < amount) throw new AppError('INSUFFICIENT_FUNDS', 'Insufficient locked balance.', 400, { locked });
      nextLocked = round(locked - amount, 10);
    } else {
      if (available + 1e-9 < amount) throw new AppError('INSUFFICIENT_FUNDS', 'Insufficient available balance.', 400, { available });
      nextAvailable = round(available - amount, 10);
    }
  } else {
    nextAvailable = round(available + amount, 10);
  }
  if (nextAvailable < -1e-9) throw new AppError('INSUFFICIENT_FUNDS', 'Balance cannot be negative.', 400);

  const updated = await tx.wallet.update({
    where: { id: wallet.id },
    data: { available: money(nextAvailable), locked: money(nextLocked) },
  });

  const ledgerTx = await tx.ledgerTransaction.create({
    data: {
      type: input.type,
      status: 'COMPLETED',
      reference: input.reference ?? null,
      description: input.description ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      entries: {
        create: [
          {
            walletId: wallet.id,
            direction: input.direction,
            amount: money(amount),
            balanceAfter: money(nextAvailable + nextLocked),
          },
        ],
      },
    },
    include: { entries: true },
  });

  // Counterparty leg keeps the ledger balanced: every transaction has equal credits and debits.
  await tx.ledgerEntry.create({
    data: {
      transactionId: ledgerTx.id,
      walletId: null,
      systemAccount: input.systemAccount ?? 'PLATFORM',
      direction: input.direction === 'CREDIT' ? 'DEBIT' : 'CREDIT',
      amount: money(amount),
      balanceAfter: money(amount),
    },
  });
  return { transaction: ledgerTx, wallet: updated };
}

/** Move funds from available → locked (e.g. reserving margin or a pending withdrawal). */
export async function lockFunds(tx: TxClient, walletId: string, amount: number) {
  const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) throw new AppError('NOT_FOUND', 'Wallet not found', 404);
  const amt = round(amount, 10);
  if (d(wallet.available) + 1e-9 < amt) throw new AppError('INSUFFICIENT_FUNDS', 'Insufficient available balance.', 400);
  return tx.wallet.update({
    where: { id: walletId },
    data: { available: money(d(wallet.available) - amt), locked: money(d(wallet.locked) + amt) },
  });
}

export async function unlockFunds(tx: TxClient, walletId: string, amount: number) {
  const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) throw new AppError('NOT_FOUND', 'Wallet not found', 404);
  const amt = round(Math.min(amount, d(wallet.locked)), 10);
  return tx.wallet.update({
    where: { id: walletId },
    data: { available: money(d(wallet.available) + amt), locked: money(d(wallet.locked) - amt) },
  });
}

/** Consume locked funds and post the outflow entry. */
export async function settleLocked(tx: TxClient, walletId: string, amount: number, type: Prisma.LedgerTransactionUncheckedCreateInput['type'], description: string, reference?: string) {
  const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) throw new AppError('NOT_FOUND', 'Wallet not found', 404);
  const amt = round(Math.min(amount, d(wallet.locked)), 10);
  // Funds already left `available` when they were locked, so the customer leg reduces `locked`.
  return postLedger(tx, { type, walletId, amount: amt, direction: 'DEBIT', description, reference, from: 'locked' });
}

export async function walletSummary(walletId: string) {
  const w = await prisma.wallet.findUnique({ where: { id: walletId }, include: { holdings: true } });
  if (!w) return { available: 0, locked: 0, total: 0, holdings: [] as { asset: string; amount: number; locked: number }[] };
  return {
    available: d(w.available),
    locked: d(w.locked),
    total: d(w.available) + d(w.locked),
    holdings: w.holdings.map((h) => ({ asset: h.asset, amount: d(h.amount), locked: d(h.locked) })),
  };
}
