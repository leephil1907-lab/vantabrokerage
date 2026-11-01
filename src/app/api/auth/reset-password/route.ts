import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { clientIp, fail, json, parseBody, rateLimit } from '@/lib/http';
import { hashToken } from '@/lib/auth';
import { resetSchema } from '@/lib/validation';
import { AppError } from '@/lib/errors';
import { notifyUserByEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await rateLimit(`reset:${clientIp(req)}`, 10, 3600);
    const body = await parseBody(req, resetSchema);
    const record = await prisma.emailToken.findUnique({ where: { tokenHash: hashToken(body.token) } });
    if (!record || record.type !== 'RESET_PASSWORD' || record.usedAt || record.expiresAt < new Date()) {
      throw new AppError('INVALID_TOKEN', 'This reset link is invalid or has expired.', 400);
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.emailToken.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
      if (consumed.count !== 1) throw new AppError('INVALID_TOKEN', 'This reset link is invalid or has expired.', 400);
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash, failedAttempts: 0, lockedUntil: null } });
      await tx.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    });
    await notifyUserByEmail(record.userId, 'password_changed');
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
