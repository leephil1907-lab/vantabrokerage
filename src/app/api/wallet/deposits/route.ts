import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { getAccountForUser } from '@/lib/accounts';
import { AppError } from '@/lib/errors';
import { d } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const account = await getAccountForUser(user.id, url.searchParams.get('accountId') ?? undefined);
    const deposits = await prisma.deposit.findMany({ where: { wallet: { accountId: account.id } }, orderBy: { createdAt: 'desc' }, take: 100 });
    const assets = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'TRX', 'LTC'];
    return json({
      deposits: deposits.map((x) => ({
        id: x.id, method: x.method, status: x.status, asset: x.asset, network: x.network, address: x.address, txHash: x.txHash,
        amount: d(x.amount), creditedAmount: x.creditedAmount != null ? d(x.creditedAmount) : null, confirmations: x.confirmations,
        requiredConfirmations: x.requiredConfirmations, createdAt: x.createdAt.toISOString(), creditedAt: x.creditedAt?.toISOString() ?? null,
        metadata: x.metadata,
      })),
      // No funding details are exposed while deposits are disabled.
      addressBook: Object.fromEntries(assets.map((a) => [a, null])),
      cardProviderConfigured: false,
    });
  } catch (err) {
    return fail(err);
  }
}

// Funding is deliberately unavailable until custody, payment rails and independent
// verification are integrated and approved. Do not issue addresses or accept claims.
export async function POST() {
  try {
    await requireUser();
    throw new AppError('DEPOSITS_UNAVAILABLE', 'Deposits are not available until funding and custody are connected.', 503);
  } catch (err) {
    return fail(err);
  }
}
