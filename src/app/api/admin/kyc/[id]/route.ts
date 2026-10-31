import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { clientIp, fail, json, parseBody } from '@/lib/http';
import { requireStaff } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { AppError } from '@/lib/errors';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    if (!['ADMIN', 'SUPERADMIN', 'FINANCE', 'SUPPORT'].includes(staff.role)) throw new AppError('FORBIDDEN', 'Not permitted.', 403);
    const { id } = await ctx.params;
    const body = await parseBody(req, z.object({ decision: z.enum(['APPROVED', 'REJECTED']), reason: z.string().max(500).optional() }));
    const kyc = await prisma.kycRecord.findUnique({ where: { id } });
    if (!kyc) throw new AppError('NOT_FOUND', 'Verification record not found.', 404);
    const updated = await prisma.kycRecord.update({
      where: { id },
      data: { status: body.decision, reviewedAt: new Date(), reviewedById: staff.id, rejectionReason: body.decision === 'REJECTED' ? body.reason ?? 'Documents could not be verified.' : null },
    });
    await prisma.notification.create({
      data: {
        userId: kyc.userId, type: 'ACCOUNT', title: body.decision === 'APPROVED' ? 'Identity verified' : 'Verification rejected',
        body: body.decision === 'APPROVED' ? 'Your identity verification was approved. Withdrawals are now available.' : `Your verification was rejected: ${updated.rejectionReason}`,
        href: '/dashboard/verification',
      },
    });
    await audit({ actorId: staff.id, action: `kyc.${body.decision.toLowerCase()}`, targetType: 'KycRecord', targetId: id, before: { status: kyc.status }, after: { status: updated.status, reason: updated.rejectionReason }, ip: clientIp(req), userAgent: req.headers.get('user-agent') ?? undefined });
    return json({ ok: true, kyc: { id: updated.id, status: updated.status } });
  } catch (err) {
    return fail(err);
  }
}
