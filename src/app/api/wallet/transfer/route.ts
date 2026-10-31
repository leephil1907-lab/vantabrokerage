import { NextRequest } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { fail, json, parseBody, rateLimit } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { postLedger, round, getOrCreateWallet } from '@/lib/ledger';
import { AppError } from '@/lib/errors';

const schema = z.object({ fromAccountId: z.string().min(1), toAccountId: z.string().min(1), amount: z.coerce.number().positive() });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await rateLimit(`transfer:${user.id}`, 20, 60);
    const body = await parseBody(req, schema);
    if (body.fromAccountId === body.toAccountId) throw new AppError('INVALID_TRANSFER', 'Choose two different accounts.', 400);
    const [from, to] = await Promise.all([
      prisma.account.findFirst({ where: { id: body.fromAccountId, userId: user.id } }),
      prisma.account.findFirst({ where: { id: body.toAccountId, userId: user.id } }),
    ]);
    if (!from || !to) throw new AppError('NOT_FOUND', 'Account not found.', 404);
    // Simulated funds must never enter a live account, or vice versa.
    if (from.type !== to.type) throw new AppError('CROSS_ENVIRONMENT_TRANSFER', 'Transfers between paper and live accounts are not permitted.', 409);
    if (from.currency !== to.currency) throw new AppError('CURRENCY_MISMATCH', 'Transfers between different account currencies are not supported.', 409);
    const amount = round(body.amount, 10);
    const reference = `transfer-${randomBytes(6).toString('hex')}`;
    await prisma.$transaction(async (tx) => {
      const fromWallet = await getOrCreateWallet(tx, from.id, from.currency);
      const toWallet = await getOrCreateWallet(tx, to.id, to.currency);
      await postLedger(tx, { type: 'TRANSFER_OUT', walletId: fromWallet.id, amount, direction: 'DEBIT', description: `Transfer to ${to.type} account`, reference });
      await postLedger(tx, { type: 'TRANSFER_IN', walletId: toWallet.id, amount, direction: 'CREDIT', description: `Transfer from ${from.type} account`, reference });
      await tx.internalTransfer.create({ data: { fromWalletId: fromWallet.id, toWalletId: toWallet.id, amount: amount.toFixed(10), reference } });
    });
    return json({ ok: true, reference, amount });
  } catch (err) {
    return fail(err);
  }
}
