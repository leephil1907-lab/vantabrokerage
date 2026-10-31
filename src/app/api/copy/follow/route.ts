import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fail, json, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { getAccountForUser } from '@/lib/accounts';
import { d } from '@/lib/ledger';

const schema = z.object({
  copyTraderId: z.string().min(1),
  allocation: z.coerce.number().positive(),
  maxExposure: z.coerce.number().positive(),
  action: z.enum(['follow', 'pause', 'stop']).default('follow'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await parseBody(req, schema);
    const trader = await prisma.copyTrader.findUnique({ where: { id: body.copyTraderId } });
    if (!trader) throw new AppError('NOT_FOUND', 'Trader not found.', 404);
    if (trader.userId === user.id) throw new AppError('INVALID_ACTION', 'You cannot copy your own account.', 400);
    const account = await getAccountForUser(user.id);
    if (!account) throw new AppError('NO_ACCOUNT', 'Trading account required.', 400);
    if (body.maxExposure > body.allocation * 3) throw new AppError('INVALID_EXPOSURE', 'Maximum exposure cannot exceed 3× the allocation.', 400);
    if (d(account.wallet?.available as never) < body.allocation) throw new AppError('INSUFFICIENT_FUNDS', 'Allocation exceeds your available balance.', 400);

    const existing = await prisma.copyRelationship.findUnique({ where: { followerId_copyTraderId: { followerId: user.id, copyTraderId: trader.id } } });
    if (body.action === 'stop') {
      if (!existing) throw new AppError('NOT_FOUND', 'You are not copying this trader.', 404);
      await prisma.$transaction([
        prisma.copyRelationship.update({ where: { id: existing.id }, data: { status: 'STOPPED', stoppedAt: new Date() } }),
        prisma.copyTrader.update({ where: { id: trader.id }, data: { followerCount: { decrement: 1 } } }),
      ]);
      return json({ ok: true, status: 'STOPPED' });
    }
    if (body.action === 'pause') {
      if (!existing) throw new AppError('NOT_FOUND', 'You are not copying this trader.', 404);
      await prisma.copyRelationship.update({ where: { id: existing.id }, data: { status: 'PAUSED' } });
      return json({ ok: true, status: 'PAUSED' });
    }
    const rel = await prisma.$transaction(async (tx) => {
      const created = existing
        ? await tx.copyRelationship.update({ where: { id: existing.id }, data: { allocation: String(body.allocation), maxExposure: String(body.maxExposure), status: 'ACTIVE', stoppedAt: null } })
        : await tx.copyRelationship.create({ data: { followerId: user.id, copyTraderId: trader.id, accountId: account.id, allocation: String(body.allocation), maxExposure: String(body.maxExposure), status: 'ACTIVE' } });
      if (!existing) await tx.copyTrader.update({ where: { id: trader.id }, data: { followerCount: { increment: 1 } } });
      return created;
    });
    return json({ ok: true, status: rel.status, allocation: d(rel.allocation) }, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}
