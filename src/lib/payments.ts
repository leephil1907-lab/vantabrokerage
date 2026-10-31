import { prisma } from './db';
import { AppError } from './errors';
import { d, postLedger, round, money } from './ledger';

/**
 * Deposit address + blockchain verification layer.
 *
 * Addresses are provided by the custody/provider configuration in the environment
 * (`CRYPTO_DEPOSIT_ADDRESSES` JSON map of asset -> {address, network, provider}).
 * Confirmation checks call the provider explorer API when a key is configured. When no
 * provider is configured we return `verifiable: false` — deposits are then queued for
 * manual finance review and are NEVER auto-credited from a user-supplied tx hash.
 */
export type DepositAddressConfig = { address: string; network: string; provider?: string; minConfirmations?: number };

export function depositAddresses(): Record<string, DepositAddressConfig> {
  try {
    return JSON.parse(process.env.CRYPTO_DEPOSIT_ADDRESSES || '{}');
  } catch {
    return {};
  }
}

export function addressFor(asset: string): DepositAddressConfig | null {
  const map = depositAddresses();
  return map[asset] ?? null;
}

export type VerificationResult = {
  verifiable: boolean;
  verified: boolean;
  confirmations: number;
  requiredConfirmations: number;
  amount?: number;
  from?: string;
  reason?: string;
};

/**
 * Verify an on-chain deposit through the configured explorer/provider.
 * Ethereum-family assets use Etherscan-compatible APIs; Bitcoin uses mempool.space;
 * TRON uses TronGrid. Without keys the result is `verifiable: false`.
 */
export async function verifyOnChainDeposit(input: { asset: string; network: string | null; txHash: string }): Promise<VerificationResult> {
  const etherscanKey = process.env.ETHERSCAN_API_KEY;
  const tronKey = process.env.TRONGRID_API_KEY;
  const net = (input.network || '').toUpperCase();

  const EVM: Record<string, string> = { ETH: '1', USDT_ERC20: '1', USDC_ERC20: '1', BNB_BEP20: '56' };
  try {
    if (input.asset === 'BTC' || net.includes('BITCOIN')) {
      const res = await fetch(`https://mempool.space/api/tx/${input.txHash}`, { cache: 'no-store' });
      if (!res.ok) return { verifiable: true, verified: false, confirmations: 0, requiredConfirmations: 3, reason: 'Transaction not found on the Bitcoin network yet.' };
      const tx = (await res.json()) as any;
      const status = await fetch(`https://mempool.space/api/tx/${input.txHash}/status`, { cache: 'no-store' });
      const st = status.ok ? ((await status.json()) as any) : { confirmed: false };
      const tip = await fetch('https://mempool.space/api/blocks/tip/height', { cache: 'no-store' });
      const height = tip.ok ? Number(await tip.text()) : 0;
      const confirmations = st.confirmed && st.block_height ? Math.max(0, height - st.block_height + 1) : 0;
      const out = (tx.vout ?? []).find((v: any) => v.scriptpubkey_address);
      return { verifiable: true, verified: confirmations >= 3, confirmations, requiredConfirmations: 3, amount: out ? Number(out.value) / 1e8 : undefined, from: out?.scriptpubkey_address };
    }
    if (etherscanKey && EVM[input.asset]) {
      const chainId = EVM[input.asset];
      const base = chainId === '56' ? 'https://api.bscscan.com' : 'https://api.etherscan.io';
      const res = await fetch(`${base}/api?module=proxy&action=eth_getTransactionReceipt&txhash=${input.txHash}&apikey=${etherscanKey}`, { cache: 'no-store' });
      const body = (await res.json()) as any;
      const receipt = body.result;
      if (!receipt) return { verifiable: true, verified: false, confirmations: 0, requiredConfirmations: 3, reason: 'Receipt not available yet.' };
      const confirmations = receipt.blockNumber ? Math.max(0, (await currentBlock(base, etherscanKey)) - parseInt(receipt.blockNumber, 16) + 1) : 0;
      const required = 3;
      return { verifiable: true, verified: confirmations >= required && receipt.status === '0x1', confirmations, requiredConfirmations: required };
    }
    if (tronKey && (input.asset === 'TRX' || net.includes('TRON'))) {
      const res = await fetch(`https://api.trongrid.io/wallet/gettransactioninfobyid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'TRON-PRO-API-KEY': tronKey },
        body: JSON.stringify({ value: input.txHash }),
        cache: 'no-store',
      });
      const body = (await res.json()) as any;
      const confirmations = body.blockNumber ? 20 : 0;
      return { verifiable: true, verified: !!body.blockNumber && body.receipt?.result === 'SUCCESS', confirmations, requiredConfirmations: 20 };
    }
  } catch (err) {
    return { verifiable: true, verified: false, confirmations: 0, requiredConfirmations: 3, reason: `Provider error: ${String(err)}` };
  }
  return { verifiable: false, verified: false, confirmations: 0, requiredConfirmations: 3, reason: 'No blockchain provider is configured for this asset. The deposit will be reviewed manually by the finance desk.' };
}

async function currentBlock(base: string, key: string) {
  const res = await fetch(`${base}/api?module=proxy&action=eth_blockNumber&apikey=${key}`, { cache: 'no-store' });
  const body = (await res.json()) as any;
  return body.result ? parseInt(body.result, 16) : 0;
}

/** Credit a deposit exactly once. Idempotent on deposit id + ledger reference. */
export async function creditDeposit(depositId: string, opts: { amount?: number; actorId?: string; note?: string } = {}) {
  const deposit = await prisma.deposit.findUnique({ where: { id: depositId }, include: { wallet: { include: { account: true } } } });
  if (!deposit) throw new AppError('NOT_FOUND', 'Deposit not found.', 404);
  if (deposit.status === 'CREDITED') throw new AppError('ALREADY_CREDITED', 'This deposit has already been credited.', 409);
  if (deposit.status === 'REJECTED' || deposit.status === 'REFUNDED') throw new AppError('INVALID_STATE', 'This deposit cannot be credited.', 409);

  const amount = round(opts.amount ?? d(deposit.amount), 10);
  if (!(amount > 0)) throw new AppError('INVALID_AMOUNT', 'Credit amount must be positive.', 400);

  const result = await prisma.$transaction(async (tx) => {
    const fresh = await tx.deposit.findUnique({ where: { id: depositId } });
    if (!fresh || fresh.status === 'CREDITED') throw new AppError('ALREADY_CREDITED', 'This deposit has already been credited.', 409);
    await postLedger(tx, {
      type: 'DEPOSIT',
      walletId: deposit.walletId,
      amount,
      direction: 'CREDIT',
      description: `Deposit · ${deposit.asset}${deposit.network ? ` (${deposit.network})` : ''}`,
      reference: `deposit:${deposit.id}`,
      metadata: { txHash: deposit.txHash, method: deposit.method, asset: deposit.asset },
    });
    const updated = await tx.deposit.update({
      where: { id: deposit.id },
      data: { status: 'CREDITED', creditedAmount: money(amount), creditedAt: new Date(), metadata: { ...(deposit.metadata as object), creditedBy: opts.actorId ?? 'system', note: opts.note ?? null } },
    });
    await tx.notification.create({
      data: {
        userId: deposit.wallet.account.userId,
        type: 'DEPOSIT',
        title: 'Deposit credited',
        body: `${amount.toFixed(2)} ${deposit.asset} was credited to your live account.`,
        href: '/dashboard/wallet',
      },
    });
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
  return prisma.commission.create({
    data: { userId: referee.referredById, amount: money(amount), rate: rate.toString(), sourceType: 'DEPOSIT', sourceTxId: sourceId, status: 'PENDING' },
  });
}
