import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { verifyToken, generateSecret, otpauthUrl } from '@/lib/totp';
import { prisma } from '@/lib/db';
import { fail, json, parseBody, rateLimit } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { getAccountForUser } from '@/lib/accounts';
import { lockFunds, round, d } from '@/lib/ledger';
import { AppError } from '@/lib/errors';
import { kycGate } from '@/lib/kyc';

export const dynamic = 'force-dynamic';

const schema = z.object({
  accountId: z.string().min(1),
  asset: z.string().min(2).max(10),
  network: z.string().trim().min(2).max(24),
  address: z.string().trim().min(10).max(128),
  amount: z.coerce.number().positive(),
  password: z.string().min(1),
  totp: z.string().trim().max(6).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const account = await getAccountForUser(user.id, url.searchParams.get('accountId') ?? undefined);
    const withdrawals = await prisma.withdrawal.findMany({ where: { wallet: { accountId: account.id } }, orderBy: { createdAt: 'desc' }, take: 100 });
    return json({
      withdrawals: withdrawals.map((w) => ({
        id: w.id, status: w.status, asset: w.asset, network: w.network, address: w.address, amount: d(w.amount), fee: d(w.fee),
        netAmount: d(w.netAmount), txHash: w.txHash, reviewNote: w.reviewNote, createdAt: w.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await rateLimit(`withdraw:${user.id}`, 5, 3600);
    const body = await parseBody(req, schema);
    await kycGate(user.id, 'withdraw');

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !(await bcrypt.compare(body.password, dbUser.passwordHash))) {
      throw new AppError('INVALID_CREDENTIALS', 'Password is incorrect.', 401);
    }
    if (dbUser.twoFactorEnabled) {
      if (!body.totp) throw new AppError('TWO_FACTOR_REQUIRED', 'Enter your authenticator code to authorise this withdrawal.', 401);
      if (!dbUser.twoFactorSecret || !verifyToken(dbUser.twoFactorSecret, body.totp)) {
        throw new AppError('INVALID_TWO_FACTOR', 'Authenticator code is invalid.', 401);
      }
    }

    const account = await getAccountForUser(user.id, body.accountId);
    if (account.type !== 'LIVE') throw new AppError('INVALID_ACCOUNT', 'Withdrawals are only available from your live account.', 400);

    const min = d((await prisma.systemConfig.findUnique({ where: { key: 'withdrawal.min' } }))?.value as never) || 20;
    const amount = round(body.amount, 10);
    const fee = round(Math.max(1, amount * 0.005), 2);
    if (amount < min) throw new AppError('BELOW_MINIMUM', `Minimum withdrawal is ${min} USD-equivalent.`, 400);
    const net = round(amount - fee, 10);
    if (net <= 0) throw new AppError('INVALID_AMOUNT', 'Withdrawal amount must exceed the network fee.', 400);

    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const daily = await prisma.withdrawal.aggregate({
      where: { wallet: { accountId: { in: (await prisma.account.findMany({ where: { userId: user.id }, select: { id: true } })).map((a) => a.id) } }, createdAt: { gte: today }, status: { notIn: ['REJECTED', 'FAILED'] } },
      _sum: { amount: true },
    });
    const maxDaily = d((await prisma.systemConfig.findUnique({ where: { key: 'withdrawal.maxDaily' } }))?.value as never) || 25000;
    if (d(daily._sum.amount) + amount > maxDaily) throw new AppError('DAILY_LIMIT', `Daily withdrawal limit of ${maxDaily} has been reached.`, 400);

    const withdrawal = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { accountId: account.id } });
      if (!wallet) throw new AppError('NOT_FOUND', 'Wallet not found.', 404);
      await lockFunds(tx, wallet.id, amount);
      const created = await tx.withdrawal.create({
        data: {
          walletId: wallet.id, status: 'PENDING', asset: body.asset.toUpperCase(), network: body.network, address: body.address,
          amount: amount.toFixed(10), fee: fee.toFixed(10), netAmount: net.toFixed(10), twoFactorVerified: dbUser.twoFactorEnabled,
          provider: process.env.CUSTODY_PROVIDER ? 'configured' : 'manual-review',
        },
      });
      await tx.notification.create({
        data: { userId: user.id, type: 'WITHDRAWAL', title: 'Withdrawal requested', body: `${amount.toFixed(2)} USD-equivalent withdrawal is pending review. Funds are reserved from your balance.`, href: '/dashboard/withdrawals' },
      });
      return created;
    });

    return json({
      withdrawal: { id: withdrawal.id, status: withdrawal.status, amount, fee, netAmount: net, address: withdrawal.address, network: withdrawal.network },
      note: process.env.CUSTODY_PROVIDER ? 'Queued for authorisation and processing.' : 'Queued for finance desk review. Automated payout requires a configured custody provider.',
    }, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}
