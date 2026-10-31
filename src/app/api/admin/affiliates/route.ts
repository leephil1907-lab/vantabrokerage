import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { clientIp, fail, json, parseBody } from '@/lib/http';
import { requireStaff } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { d } from '@/lib/ledger';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireStaff();
    const [referrals, commissions, cfg] = await Promise.all([
      prisma.referral.findMany({ include: { referrer: { select: { email: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.commission.findMany({ include: { user: { select: { email: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.systemConfig.findUnique({ where: { key: 'referral.commissionRate' } }),
    ]);
    return json({
      commissionRate: d(cfg?.value as never) || 0.15,
      referrals: referrals.map((r) => ({ id: r.id, referrer: r.referrer.email, referee: r.refereeEmail, status: r.status, createdAt: r.createdAt.toISOString() })),
      commissions: commissions.map((c) => ({ id: c.id, email: c.user.email, amount: d(c.amount), rate: d(c.rate), sourceType: c.sourceType, status: c.status, createdAt: c.createdAt.toISOString() })),
    });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff();
    if (!['ADMIN', 'SUPERADMIN'].includes(staff.role)) throw new AppError('FORBIDDEN', 'Administrator role required.', 403);
    const body = await parseBody(req, z.object({ commissionId: z.string(), action: z.enum(['approve', 'reject']) }));
    const c = await prisma.commission.findUnique({ where: { id: body.commissionId } });
    if (!c) throw new AppError('NOT_FOUND', 'Commission not found.', 404);
    if (c.status !== 'PENDING') throw new AppError('INVALID_STATE', 'Only pending commissions can be reviewed.', 409);
    const updated = await prisma.commission.update({ where: { id: c.id }, data: { status: body.action === 'approve' ? 'APPROVED' : 'REJECTED', approvedAt: new Date() } });
    await audit({ actorId: staff.id, action: `commission.${body.action}`, targetType: 'Commission', targetId: c.id, before: { status: c.status }, after: { status: updated.status }, ip: clientIp(req) });
    return json({ ok: true, status: updated.status });
  } catch (err) {
    return fail(err);
  }
}
