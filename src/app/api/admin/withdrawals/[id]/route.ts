import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { clientIp, fail, json, parseBody } from '@/lib/http';
import { requireStaff } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { unlockFunds, settleLocked, d, getOrCreateWallet } from '@/lib/ledger';
import { AppError } from '@/lib/errors';
import { notifyUserByEmail } from '@/lib/email';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    if (!['ADMIN', 'SUPERADMIN', 'FINANCE'].includes(staff.role)) throw new AppError('FORBIDDEN', 'Finance or admin role required.', 403);
    const { id } = await ctx.params;
    const body = await parseBody(req, z.object({ action: z.enum(['approve', 'reject', 'mark_completed']), note: z.string().max(500).optional(), txHash: z.string().max(120).optional() }));
    const w = await prisma.withdrawal.findUnique({ where: { id }, include: { wallet: { include: { account: true } } } });
    if (!w) throw new AppError('NOT_FOUND', 'Withdrawal not found.', 404);
    const amount = d(w.amount);

    if (body.action === 'reject') {
      if (['COMPLETED', 'REJECTED', 'FAILED'].includes(w.status)) throw new AppError('INVALID_STATE', 'This withdrawal is already finalised.', 409);
      const updated = await prisma.$transaction(async (tx) => {
        const wallet = await getOrCreateWallet(tx, w.wallet.accountId, w.wallet.account.currency);
        await unlockFunds(tx, wallet.id, amount);
        const u = await tx.withdrawal.update({ where: { id }, data: { status: 'REJECTED', reviewNote: body.note ?? 'Rejected by finance', reviewedById: staff.id, reviewedAt: new Date() } });
        await tx.notification.create({ data: { userId: w.wallet.account.userId, type: 'WITHDRAWAL', title: 'Withdrawal rejected', body: `Your withdrawal of ${amount.toFixed(2)} was rejected and the funds returned to your available balance. ${body.note ?? ''}`.trim() } });
        return u;
      });
      await audit({ actorId: staff.id, action: 'withdrawal.reject', targetType: 'Withdrawal', targetId: id, before: { status: w.status }, after: { status: updated.status, note: body.note }, ip: clientIp(req) });
      await notifyUserByEmail(w.wallet.account.userId, 'withdrawal_rejected');
      return json({ ok: true, status: updated.status });
    }

    if (body.action === 'approve') {
      if (w.status !== 'PENDING' && w.status !== 'UNDER_REVIEW') throw new AppError('INVALID_STATE', 'Only pending withdrawals can be approved.', 409);
      if (!process.env.CUSTODY_PROVIDER) {
        // Approval without a custody provider only moves the request to "approved — awaiting manual payout".
        const u = await prisma.withdrawal.update({ where: { id }, data: { status: 'APPROVED', reviewedById: staff.id, reviewedAt: new Date(), reviewNote: body.note ?? 'Approved — awaiting manual payout (no custody provider configured).' } });
        await audit({ actorId: staff.id, action: 'withdrawal.approve', targetType: 'Withdrawal', targetId: id, before: { status: w.status }, after: { status: u.status }, ip: clientIp(req) });
        return json({ ok: true, status: u.status, note: 'No custody provider configured: payout must be sent manually and marked completed with a transaction hash.' });
      }
      const u = await prisma.withdrawal.update({ where: { id }, data: { status: 'PROCESSING', reviewedById: staff.id, reviewedAt: new Date(), reviewNote: body.note ?? null } });
      await audit({ actorId: staff.id, action: 'withdrawal.approve', targetType: 'Withdrawal', targetId: id, before: { status: w.status }, after: { status: u.status }, ip: clientIp(req) });
      return json({ ok: true, status: u.status });
    }

    // mark_completed: settle the reserved funds out of the ledger
    if (!body.txHash) throw new AppError('TX_REQUIRED', 'A provider or blockchain transaction hash is required to complete a withdrawal.', 400);
    const existing = await prisma.withdrawal.findUnique({ where: { id }, select: { status: true } });
    if (existing?.status === 'COMPLETED') throw new AppError('ALREADY_COMPLETED', 'Withdrawal already completed.', 409);
    const updated = await prisma.$transaction(async (tx) => {
      const wallet = await getOrCreateWallet(tx, w.wallet.accountId, w.wallet.account.currency);
      await settleLocked(tx, wallet.id, amount, 'WITHDRAWAL', `Withdrawal · ${w.asset} (${w.network})`, `withdrawal:${id}`);
      const u = await tx.withdrawal.update({ where: { id }, data: { status: 'COMPLETED', txHash: body.txHash, reviewedById: staff.id, reviewedAt: new Date(), reviewNote: body.note ?? null } });
      await tx.notification.create({ data: { userId: w.wallet.account.userId, type: 'WITHDRAWAL', title: 'Withdrawal completed', body: `Your withdrawal of ${amount.toFixed(2)} has been sent. Transaction: ${body.txHash}`, href: '/dashboard/withdrawals' } });
      return u;
    });
    await audit({ actorId: staff.id, action: 'withdrawal.complete', targetType: 'Withdrawal', targetId: id, before: { status: w.status }, after: { status: updated.status, txHash: body.txHash }, ip: clientIp(req) });
    await notifyUserByEmail(w.wallet.account.userId, 'withdrawal_completed');
    return json({ ok: true, status: updated.status });
  } catch (err) {
    return fail(err);
  }
}
