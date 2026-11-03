import { prisma } from './db';
import { AppError } from './errors';
import { d, postLedger, round, money } from './ledger';

/** Shared receive addresses are stored as the funding.depositAddresses system config. */
export type DepositAddressConfig = { address: string; network: string; provider?: string; minConfirmations?: number };

export function depositAddresses(): Record<string, DepositAddressConfig> {
  try { return JSON.parse(process.env.CRYPTO_DEPOSIT_ADDRESSES || '{}'); }
  catch { return {}; }
}

export async function loadDepositAddresses(): Promise<Record<string, DepositAddressConfig>> {
  const config = await prisma.systemConfig.findUnique({ where: { key: 'funding.depositAddresses' } });
  const value = config?.value;
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, DepositAddressConfig>;
  return depositAddresses();
}

export async function addressFor(asset: string, network?: string): Promise<DepositAddressConfig | null> {
  const map = await loadDepositAddresses();
  return (network ? map[`${asset}:${network}`] : undefined) ?? map[asset] ?? null;
}

export type VerificationResult = {
  verifiable: boolean; verified: boolean; confirmations: number; requiredConfirmations: number;
  amount?: number; from?: string; reason?: string;
};

/** Manual finance review only. A submitted transaction hash is never treated as proof. */
export async function verifyOnChainDeposit(_input: { asset: string; network: string | null; txHash: string }): Promise<VerificationResult> {
  return { verifiable: false, verified: false, confirmations: 0, requiredConfirmations: 3,
    reason: 'Automated deposit verification is not connected. Finance must independently verify the destination, asset, amount, network and finality.' };
}

/** Credit a deposit exactly once. This is called only by the staff review endpoint. */
export async function creditDeposit(depositId: string, opts: { amount?: number; actorId?: string; note?: string } = {}) {
  const deposit = await prisma.deposit.findUnique({ where: { id: depositId }, include: { wallet: { include: { account: true } } } });
  if (!deposit) throw new AppError('NOT_FOUND', 'Deposit not found.', 404);
  if (deposit.status === 'CREDITED') throw new AppError('ALREADY_CREDITED', 'This deposit has already been credited.', 409);
  if (deposit.status === 'REJECTED' || deposit.status === 'REFUNDED') throw new AppError('INVALID_STATE', 'This deposit cannot be credited.', 409);
  const amount = round(opts.amount ?? d(deposit.amount), 10);
  if (!(amount > 0)) throw new AppError('INVALID_AMOUNT', 'Credit amount must be positive.', 400);

  const result = await prisma.$transaction(async (tx) => {
    const fresh = await tx.deposit.findUnique({ where: { id: depositId } });
    if (!fresh || fresh.status === 'CREDITED' || fresh.status === 'REJECTED' || fresh.status === 'REFUNDED') {
      throw new AppError('INVALID_STATE', 'This deposit is no longer awaiting review.', 409);
    }
    await postLedger(tx, { type: 'DEPOSIT', walletId: deposit.walletId, amount, direction: 'CREDIT',
      description: `Deposit · ${deposit.asset}${deposit.network ? ` (${deposit.network})` : ''}`,
      reference: `deposit:${deposit.id}`, metadata: { txHash: deposit.txHash, method: deposit.method, asset: deposit.asset } });
    const updated = await tx.deposit.update({ where: { id: deposit.id }, data: {
      status: 'CREDITED', creditedAmount: money(amount), creditedAt: new Date(),
      metadata: { ...(deposit.metadata as object), creditedBy: opts.actorId ?? 'system', note: opts.note ?? null },
    } });
    await tx.notification.create({ data: { userId: deposit.wallet.account.userId, type: 'DEPOSIT',
      title: 'Deposit credited', body: `${amount.toFixed(2)} USD was credited to your live account.`, href: '/dashboard/wallet' } });
    await tx.referral.updateMany({ where: { refereeUserId: deposit.wallet.account.userId, status: 'REGISTERED' }, data: { status: 'QUALIFIED', qualifiedAt: new Date() } });
    return updated;
  });
  await accrueReferralCommission(deposit.wallet.account.userId, amount, deposit.id).catch((e) => console.error('[referral commission]', e));
  return result;
}

export async function accrueReferralCommission(refereeUserId: string, baseAmount: number, sourceId: string) {
  const referee = await prisma.user.findUnique({ where: { id: refereeUserId } });
  if (!referee?.referredById) return null;
  const cfg = await prisma.systemConfig.findUnique({ where: { key: 'referral.commissionRate' } });
  const rate = d(cfg?.value as never) || 0.15;
  const amount = round(baseAmount * rate, 10);
  if (amount <= 0) return null;
  return prisma.commission.create({ data: { userId: referee.referredById, amount: money(amount), rate: rate.toString(), sourceType: 'DEPOSIT', sourceTxId: sourceId, status: 'PENDING' } });
}
