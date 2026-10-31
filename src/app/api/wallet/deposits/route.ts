import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fail, json, parseBody, rateLimit } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { getAccountForUser } from '@/lib/accounts';
import { addressFor, verifyOnChainDeposit } from '@/lib/payments';
import { AppError } from '@/lib/errors';
import { d } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  accountId: z.string().min(1),
  asset: z.string().min(2).max(10),
  amount: z.coerce.number().positive(),
  txHash: z.string().trim().min(10).optional(),
  network: z.string().trim().max(24).optional(),
});

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
      addressBook: Object.fromEntries(assets.map((a) => [a, addressFor(a)])),
      cardProviderConfigured: !!(process.env.PAYMENT_PROVIDER && process.env.PAYMENT_PROVIDER_KEY),
    });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await rateLimit(`deposit:${user.id}`, 10, 3600);
    const body = await parseBody(req, createSchema);
    const account = await getAccountForUser(user.id, body.accountId);
    if (account.type !== 'LIVE') throw new AppError('INVALID_ACCOUNT', 'Deposits can only be made to your live account.', 400);
    const wallet = await prisma.wallet.findUnique({ where: { accountId: account.id } });
    if (!wallet) throw new AppError('NOT_FOUND', 'Wallet not found.', 404);

    const asset = body.asset.toUpperCase();
    const cfg = addressFor(asset);
    if (body.txHash) {
      const existing = await prisma.deposit.findUnique({ where: { txHash: body.txHash } });
      if (existing) throw new AppError('DUPLICATE_TX', 'A deposit for this transaction hash already exists.', 409);
      const verification = await verifyOnChainDeposit({ asset, network: body.network ?? cfg?.network ?? null, txHash: body.txHash });
      const deposit = await prisma.deposit.create({
        data: {
          walletId: wallet.id,
          method: 'CRYPTO',
          status: verification.verified ? 'CONFIRMING' : 'PENDING',
          asset,
          network: body.network ?? cfg?.network ?? null,
          address: cfg?.address ?? null,
          txHash: body.txHash,
          amount: body.amount.toFixed(10),
          confirmations: verification.confirmations,
          requiredConfirmations: verification.requiredConfirmations,
          provider: verification.verifiable ? 'explorer' : 'manual',
          metadata: { verification },
        },
      });
      await prisma.notification.create({
        data: { userId: user.id, type: 'DEPOSIT', title: 'Deposit submitted', body: verification.verified
          ? 'Your transaction is confirmed on-chain and is queued for credit by the finance desk.'
          : 'Your deposit was recorded and is awaiting verification by the finance desk.', href: '/dashboard/deposits' },
      });
      return json({ deposit: { id: deposit.id, status: deposit.status }, verification }, { status: 201 });
    }

    if (!cfg) {
      throw new AppError('DEPOSIT_ADDRESS_UNAVAILABLE', `No deposit address is configured for ${asset}. The custody provider for this asset has not been connected on this deployment.`, 409);
    }
    const deposit = await prisma.deposit.create({
      data: {
        walletId: wallet.id, method: 'CRYPTO', status: 'PENDING', asset, network: cfg.network,
        address: cfg.address, amount: body.amount.toFixed(10), requiredConfirmations: cfg.minConfirmations ?? 3,
        metadata: { intent: true },
      },
    });
    return json({ deposit: { id: deposit.id, address: cfg.address, network: cfg.network, asset, status: deposit.status } }, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}
