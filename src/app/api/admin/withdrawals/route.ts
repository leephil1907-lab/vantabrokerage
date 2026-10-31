import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireStaff } from '@/lib/auth';
import { d } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    const status = new URL(req.url).searchParams.get('status');
    const rows = await prisma.withdrawal.findMany({
      where: status && status !== 'ALL' ? { status: status as never } : {},
      include: { wallet: { include: { account: { include: { user: { select: { email: true, kyc: true } } } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return json({
      withdrawals: rows.map((w) => ({
        id: w.id, email: w.wallet.account.user.email, kycStatus: w.wallet.account.user.kyc?.status ?? 'NOT_SUBMITTED', status: w.status,
        asset: w.asset, network: w.network, address: w.address, amount: d(w.amount), fee: d(w.fee), netAmount: d(w.netAmount),
        txHash: w.txHash, provider: w.provider, reviewNote: w.reviewNote, twoFactorVerified: w.twoFactorVerified,
        createdAt: w.createdAt.toISOString(), reviewedAt: w.reviewedAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    return fail(err);
  }
}
