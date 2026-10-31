import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyToken, generateSecret, otpauthUrl } from '@/lib/totp';
import { prisma } from '@/lib/db';
import { clientIp, fail, json, parseBody, rateLimit } from '@/lib/http';
import { loginSchema } from '@/lib/validation';
import { createSession } from '@/lib/auth';
import { ensureAccounts } from '@/lib/accounts';
import { AppError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const body = await parseBody(req, loginSchema);
    await rateLimit(`login:${ip}:${body.email}`, 8, 300);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401);
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError('ACCOUNT_LOCKED', 'Too many failed attempts. Try again in a few minutes.', 423);
    }
    if (!['ACTIVE', 'RESTRICTED', 'PENDING'].includes(user.status)) {
      throw new AppError('ACCOUNT_DISABLED', 'This account is not available. Contact support.', 403);
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      const attempts = user.failedAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: attempts, lockedUntil: attempts >= 6 ? new Date(Date.now() + 15 * 60_000) : null },
      });
      throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401);
    }

    if (user.twoFactorEnabled) {
      if (!body.totp) throw new AppError('TWO_FACTOR_REQUIRED', 'Enter the 6-digit code from your authenticator app.', 401);
      const valid = user.twoFactorSecret ? verifyToken(user.twoFactorSecret, body.totp) : false;
      if (!valid) throw new AppError('INVALID_TWO_FACTOR', 'That authenticator code is not valid.', 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: ip },
    });
    await ensureAccounts(user.id);
    await createSession(user.id, { ip, userAgent: req.headers.get('user-agent') ?? undefined });

    return json({ user: { id: user.id, email: user.email, role: user.role, twoFactorEnabled: user.twoFactorEnabled } });
  } catch (err) {
    return fail(err);
  }
}
