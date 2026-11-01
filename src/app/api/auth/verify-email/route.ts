import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fail, json, parseBody } from '@/lib/http';
import { hashToken } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const { token } = await parseBody(req, z.object({ token: z.string().min(10) }));
    const record = await prisma.emailToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.type !== 'VERIFY_EMAIL' || record.usedAt || record.expiresAt < new Date()) {
      throw new AppError('INVALID_TOKEN', 'This verification link is invalid or has expired.', 400);
    }
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.emailToken.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
      if (consumed.count !== 1) throw new AppError('INVALID_TOKEN', 'This verification link is invalid or has expired.', 400);
      await tx.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
    });
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
