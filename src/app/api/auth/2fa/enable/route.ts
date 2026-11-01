import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyToken, generateSecret, otpauthUrl } from '@/lib/totp';
import { prisma } from '@/lib/db';
import { fail, json, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { notifyUserByEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    const { code } = await parseBody(req, z.object({ code: z.string().trim().length(6) }));
    const user = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!user?.twoFactorSecret) throw new AppError('NOT_READY', 'Start two-factor setup first.', 400);
    if (!verifyToken(user.twoFactorSecret, code)) throw new AppError('INVALID_CODE', 'That code is not valid. Check your authenticator app.', 400);
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
    await prisma.notification.create({ data: { userId: user.id, type: 'SECURITY', title: 'Two-factor authentication enabled', body: 'Your account is now protected with an authenticator app.' } });
    if (!user.twoFactorEnabled) await notifyUserByEmail(auth.id, 'two_factor_enabled');
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
