import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fail, json, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { getAccountForUser } from '@/lib/accounts';
import { AppError } from '@/lib/errors';
import { d } from '@/lib/ledger';
import { loadDepositAddresses } from '@/lib/payments';

export const dynamic = 'force-dynamic';

const NETWORKS: Record<string, string[]> = {
  BTC: ['Bitcoin'], ETH: ['Ethereum'], USDT: ['ERC20', 'TRC20'],
  SOL: ['Solana'], DOGE: ['Dogecoin'], TRX: ['Tron'],
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const account = await getAccountForUser(user.id, url.searchParams.get('accountId') ?? undefined);
    const deposits = await prisma.deposit.findMany({ where: { wallet: { accountId: account.id } }, orderBy: { createdAt: 'desc' }, take: 100 });
    const addressBook = await loadDepositAddresses();
    return json({
      deposits: deposits.map((x) => ({
        id: x.id, method: x.method, status: x.status, asset: x.asset, network: x.network, address: x.address, txHash: x.txHash,
        amount: d(x.amount), creditedAmount: x.creditedAmount != null ? d(x.creditedAmount) : null, confirmations: x.confirmations,
        requiredConfirmations: x.requiredConfirmations, createdAt: x.createdAt.toISOString(), creditedAt: x.creditedAt?.toISOString() ?? null,
        metadata: x.metadata,
      })),
      addressBook,
      networks: NETWORKS,
      cardProviderConfigured: false,
    });
  } catch (err) { return fail(err); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await parseBody(req, z.object({
      accountId: z.string().min(1),
      asset: z.enum(['BTC', 'ETH', 'USDT', 'SOL', 'DOGE', 'TRX']),
      network: z.string().min(2).max(24),
      amountUsd: z.coerce.number().positive().max(100000000),
      cryptoAmount: z.string().max(80).optional(),
      txHash: z.string().trim().min(8).max(200),
    }));
    if (!NETWORKS[body.asset]?.includes(body.network)) throw new AppError('INVALID_NETWORK', 'Select a supported network for this asset.', 400);
    const account = await getAccountForUser(user.id, body.accountId);
    if (account.type !== 'LIVE' || !account.wallet) throw new AppError('INVALID_ACCOUNT', 'Deposits can only be submitted to a live account.', 400);
    const addressBook = await loadDepositAddresses();
    const config = addressBook[`${body.asset}:${body.network}`];
    if (!config?.address) throw new AppError('ADDRESS_UNAVAILABLE', 'The selected deposit network is not configured. Contact support.', 409);
    const duplicate = await prisma.deposit.findFirst({ where: { txHash: body.txHash } });
    if (duplicate) throw new AppError('DUPLICATE_TX_HASH', 'This transaction hash has already been submitted.', 409);

    const deposit = await prisma.$transaction(async (tx) => {
      const created = await tx.deposit.create({ data: {
        walletId: account.wallet!.id, method: 'CRYPTO', status: 'PENDING', asset: body.asset, network: body.network,
        address: config.address, txHash: body.txHash, amount: body.amountUsd, requiredConfirmations: config.minConfirmations ?? 3,
        provider: 'manual-review', metadata: { reviewMode: 'MANUAL', amountUsd: body.amountUsd, cryptoAmount: body.cryptoAmount ?? null },
      } });
      await tx.notification.create({ data: { userId: user.id, type: 'DEPOSIT', title: 'Deposit submitted',
        body: `Your ${body.asset} deposit submission is awaiting finance review. No funds have been credited yet.`,
        href: '/dashboard/deposits' } });
      return created;
    });
    return json({ ok: true, deposit: { id: deposit.id, status: deposit.status, asset: deposit.asset, network: deposit.network, amount: d(deposit.amount), createdAt: deposit.createdAt.toISOString() } }, { status: 201 });
  } catch (err) { return fail(err); }
}
