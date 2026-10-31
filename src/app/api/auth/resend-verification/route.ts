import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { fail, json, rateLimit } from '@/lib/http';
import { hashToken, requireUser } from '@/lib/auth';
import { emailConfigured, queueTemplateEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await rateLimit(`resend:${user.id}`, 5, 3600);
    const profile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { firstName: true } });
    const token = randomBytes(32).toString('base64url');
    await prisma.emailToken.create({ data: { userId: user.id, type: 'VERIFY_EMAIL', tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 86400_000) } });
    const link = `${process.env.APP_URL ?? 'http://localhost:3000'}/verify-email?token=${token}`;
    const delivery = await queueTemplateEmail({ to: user.email, template: 'verify_email', variables: { firstName: profile?.firstName ?? undefined, actionUrl: link } });
    return json({ ok: true, delivery: { configured: emailConfigured(), delivered: delivery.delivered } });
  } catch (err) {
    return fail(err);
  }
}
