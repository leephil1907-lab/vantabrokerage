import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { clientIp, fail, json, parseBody } from '@/lib/http';
import { requireStaff } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { creditDeposit } from '@/lib/payments';
import { AppError } from '@/lib/errors';
import { queueTemplateEmail } from '@/lib/email';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    if (!['ADMIN', 'SUPERADMIN', 'FINANCE'].includes(staff.role)) throw new AppError('FORBIDDEN', 'Finance or admin role required.', 403);
    const { id } = await ctx.params;
    const body = await parseBody(req, z.object({ action: z.enum(['credit', 'reject']), amount: z.coerce.number().positive().optional(), note: z.string().max(500).optional() }));
    const deposit = await prisma.deposit.findUnique({ where: { id }, include: { wallet: { include: { account: { include: { user: { include: { profile: true } } } } } } } });
    if (!deposit) throw new AppError('NOT_FOUND', 'Deposit not found.', 404);

    if (body.action === 'credit') {
      const result = await creditDeposit(id, { amount: body.amount, actorId: staff.id, note: body.note });
      await queueTemplateEmail({ to: deposit.wallet.account.user.email, template: 'deposit_approved', variables: { firstName: deposit.wallet.account.user.profile?.firstName ?? undefined, amount: String(result.creditedAmount ?? body.amount ?? deposit.amount), asset: deposit.asset, network: deposit.network ?? undefined, reference: deposit.txHash ?? deposit.id } }).catch((error) => console.error('[deposit approval email]', error));
      await audit({ actorId: staff.id, action: 'deposit.credit', targetType: 'Deposit', targetId: id, before: { status: deposit.status }, after: { status: result.status, amount: body.amount ?? Number(deposit.amount) }, ip: clientIp(req), userAgent: req.headers.get('user-agent') ?? undefined });
      return json({ ok: true, deposit: { id: result.id, status: result.status } });
    }
    if (deposit.status === 'CREDITED') throw new AppError('INVALID_STATE', 'Credited deposits cannot be rejected; issue an adjustment instead.', 409);
    const updated = await prisma.deposit.update({ where: { id }, data: { status: 'REJECTED', metadata: { ...(deposit.metadata as object), rejectionNote: body.note ?? null, rejectedBy: staff.id } } });
    await queueTemplateEmail({ to: deposit.wallet.account.user.email, template: 'deposit_rejected', variables: { firstName: deposit.wallet.account.user.profile?.firstName ?? undefined, amount: String(deposit.amount), asset: deposit.asset, network: deposit.network ?? undefined, reason: body.note ?? 'Please contact support for assistance.', reference: deposit.txHash ?? deposit.id } }).catch((error) => console.error('[deposit rejection email]', error));
    await audit({ actorId: staff.id, action: 'deposit.reject', targetType: 'Deposit', targetId: id, before: { status: deposit.status }, after: { status: updated.status, note: body.note }, ip: clientIp(req) });
    return json({ ok: true, deposit: { id: updated.id, status: updated.status } });
  } catch (err) {
    return fail(err);
  }
}
