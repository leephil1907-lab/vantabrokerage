import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { verifyToken, generateSecret, otpauthUrl } from '@/lib/totp';
import { prisma } from '@/lib/db';
import { fail, json, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    const { password, code } = await parseBody(req, z.object({ password: z.string().min(1), code: z.string().trim().length(6) }));
    const user = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
    if (!(await bcrypt.compare(password, user.passwordHash))) throw new AppError('INVALID_CREDENTIALS', 'Password is incorrect.', 401);
    if (!user.twoFactorSecret || !verifyToken(user.twoFactorSecret, code)) throw new AppError('INVALID_CODE', 'That code is not valid.', 400);
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
    await prisma.notification.create({ data: { userId: user.id, type: 'SECURITY', title: 'Two-factor authentication disabled', body: 'Two-factor authentication was removed from your account.' } });
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
