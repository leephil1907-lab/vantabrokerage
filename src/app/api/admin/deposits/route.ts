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
    const deposits = await prisma.deposit.findMany({
      where: status && status !== 'ALL' ? { status: status as never } : {},
      include: { wallet: { include: { account: { include: { user: { select: { email: true, id: true } } } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return json({
      deposits: deposits.map((x) => ({
        id: x.id, email: x.wallet.account.user.email, accountType: x.wallet.account.type, method: x.method, status: x.status,
        asset: x.asset, network: x.network, address: x.address, txHash: x.txHash, amount: d(x.amount),
        creditedAmount: x.creditedAmount != null ? d(x.creditedAmount) : null, confirmations: x.confirmations,
        requiredConfirmations: x.requiredConfirmations, provider: x.provider, metadata: x.metadata,
        createdAt: x.createdAt.toISOString(), creditedAt: x.creditedAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    return fail(err);
  }
}
