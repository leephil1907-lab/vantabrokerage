import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { clientIp, fail, json, parseBody, rateLimit } from '@/lib/http';
import { registerSchema } from '@/lib/validation';
import { createSession, hashToken } from '@/lib/auth';
import { ensureAccounts } from '@/lib/accounts';
import { queueEmail, emailConfigured } from '@/lib/email';
import { AppError } from '@/lib/errors';

function makeReferralCode() {
  return 'VN' + randomBytes(4).toString('hex').toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    await rateLimit(`register:${ip}`, 30, 3600);
    const body = await parseBody(req, registerSchema);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new AppError('EMAIL_IN_USE', 'An account with this email already exists.', 409);

    let referredById: string | null = null;
    if (body.referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: body.referralCode.toUpperCase() } });
      if (referrer) referredById = referrer.id;
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        status: 'ACTIVE',
        referralCode: makeReferralCode(),
        referredById,
        profile: {
          create: { firstName: body.firstName, lastName: body.lastName, country: body.country, phone: body.phone || null },
        },
        kyc: { create: { status: 'NOT_SUBMITTED' } },
        notifications: {
          create: [
            { type: 'ACCOUNT', title: 'Welcome to PRIMEVEST', body: 'Your PRIMEVEST workspace is ready. Live trading and funding are not yet available.' },
            { type: 'SECURITY', title: 'Confirm your email address', body: 'Verify your email to secure your account. Funding and withdrawals require additional services and checks.' },
          ],
        },
      },
    });

    await ensureAccounts(user.id);

    if (referredById) {
      await prisma.referral.create({
        data: { referrerId: referredById, refereeEmail: user.email, refereeUserId: user.id, status: 'REGISTERED' },
      });
    }

    const token = randomBytes(32).toString('base64url');
    await prisma.emailToken.create({
      data: { userId: user.id, type: 'VERIFY_EMAIL', tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 86400_000) },
    });
    const link = `${process.env.APP_URL ?? 'http://localhost:3000'}/verify-email?token=${token}`;
    const delivery = await queueEmail({
      to: user.email,
      subject: 'Verify your PRIMEVEST account',
      body: `Welcome to PRIMEVEST.\n\nConfirm your email address:\n${link}\n\nThis link expires in 24 hours.`,
      template: 'verify_email',
    });

    await createSession(user.id, { ip, userAgent: req.headers.get('user-agent') ?? undefined });

    return json({
      user: { id: user.id, email: user.email, referralCode: user.referralCode },
      emailDelivery: {
        configured: emailConfigured(),
        delivered: delivery.delivered,
      },
    }, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}
