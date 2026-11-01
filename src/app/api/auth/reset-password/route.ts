import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { clientIp, fail, json, parseBody, rateLimit } from '@/lib/http';
import { hashToken } from '@/lib/auth';
import { resetSchema } from '@/lib/validation';
import { queueTemplateEmail } from '@/lib/email';
import { AppError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    await rateLimit(`reset:${clientIp(req)}`, 10, 3600);
    const body = await parseBody(req, resetSchema);
    const record = await prisma.emailToken.findUnique({ where: { tokenHash: hashToken(body.token) }, include: { user: { include: { profile: true } } } });
    if (!record || record.type !== 'RESET_PASSWORD' || record.usedAt || record.expiresAt < new Date()) {
      throw new AppError('INVALID_TOKEN', 'This reset link is invalid or has expired.', 400);
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    await prisma.$transaction([
      prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash, failedAttempts: 0, lockedUntil: null } }),
      prisma.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await queueTemplateEmail({ to: record.user.email, template: 'security_alert', variables: { firstName: record.user.profile?.firstName ?? undefined, event: 'Password changed', time: new Date().toISOString(), ipAddress: clientIp(req) } }).catch((error) => console.error('[password reset security email]', error));
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
