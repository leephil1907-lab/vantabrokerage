import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { getAccountForUser } from '@/lib/accounts';
import { d } from '@/lib/ledger';
import { getCryptoDepositAddresses } from '@/lib/deposit-addresses';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const account = await getAccountForUser(user.id, url.searchParams.get('accountId') ?? undefined);
    const deposits = await prisma.deposit.findMany({ where: { wallet: { accountId: account.id } }, orderBy: { createdAt: 'desc' }, take: 100 });
    const addresses = await getCryptoDepositAddresses();
    return json({
      deposits: deposits.map((x) => ({
        id: x.id, method: x.method, status: x.status, asset: x.asset, network: x.network, address: x.address, txHash: x.txHash,
        amount: d(x.amount), creditedAmount: x.creditedAmount != null ? d(x.creditedAmount) : null, confirmations: x.confirmations,
        requiredConfirmations: x.requiredConfirmations, createdAt: x.createdAt.toISOString(), creditedAt: x.creditedAt?.toISOString() ?? null,
        metadata: x.metadata,
      })),
      addressBook: addresses,
      cardProviderConfigured: false,
    });
  } catch (err) {
    return fail(err);
  }
}
