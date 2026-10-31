import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fail, json, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { d, postLedger, getOrCreateWallet, round } from '@/lib/ledger';
import { AppError } from '@/lib/errors';

export async function GET() {
  try {
    const user = await requireUser();
    const [referrals, commissions, cfg, accounts] = await Promise.all([
      prisma.referral.findMany({ where: { referrerId: user.id }, orderBy: { createdAt: 'desc' } }),
      prisma.commission.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.systemConfig.findUnique({ where: { key: 'referral.commissionRate' } }),
      prisma.account.findMany({ where: { userId: user.id, type: 'LIVE' } }),
    ]);
    const paid = commissions.filter((c) => c.status === 'PAID').reduce((s, c) => s + d(c.amount), 0);
    const pending = commissions.filter((c) => c.status === 'PENDING' || c.status === 'APPROVED').reduce((s, c) => s + d(c.amount), 0);
    return json({
      code: user.email.split('@')[0].slice(0, 4).toUpperCase() + user.id.slice(-4).toUpperCase(),
      referralCode: (await prisma.user.findUnique({ where: { id: user.id }, select: { referralCode: true } }))?.referralCode,
      link: `${process.env.APP_URL ?? 'http://localhost:3000'}/register?ref=${(await prisma.user.findUnique({ where: { id: user.id }, select: { referralCode: true } }))?.referralCode}`,
      commissionRate: d(cfg?.value as never) || 0.15,
      stats: {
        registered: referrals.length,
        qualified: referrals.filter((r) => r.status !== 'REGISTERED').length,
        totalEarned: paid + pending,
        pending,
        paid,
      },
      referrals: referrals.map((r) => ({ id: r.id, email: r.refereeEmail, status: r.status, createdAt: r.createdAt.toISOString(), qualifiedAt: r.qualifiedAt?.toISOString() ?? null })),
      commissions: commissions.map((c) => ({ id: c.id, amount: d(c.amount), rate: d(c.rate), sourceType: c.sourceType, status: c.status, createdAt: c.createdAt.toISOString() })),
      canRequestPayout: !!(accounts[0]),
    });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await parseBody(req, z.object({ confirm: z.literal(true) }));
    const pending = await prisma.commission.findMany({ where: { userId: user.id, status: 'APPROVED' } });
    const total = round(pending.reduce((s, c) => s + d(c.amount), 0), 10);
    if (total <= 0) throw new AppError('NOTHING_TO_PAY', 'No approved commissions are available for payout.', 400);
    const account = await prisma.account.findFirst({ where: { userId: user.id, type: 'LIVE' } });
    if (!account) throw new AppError('NO_ACCOUNT', 'A live account is required.', 400);
    await prisma.$transaction(async (tx) => {
      const wallet = await getOrCreateWallet(tx, account.id, account.currency);
      await postLedger(tx, { type: 'REFERRAL_COMMISSION', walletId: wallet.id, amount: total, direction: 'CREDIT', description: 'Referral commission payout', reference: `commission:${user.id}:${Date.now()}` });
      await tx.commission.updateMany({ where: { id: { in: pending.map((p) => p.id) } }, data: { status: 'PAID', paidAt: new Date() } });
    });
    return json({ ok: true, paid: total });
  } catch (err) {
    return fail(err);
  }
}
