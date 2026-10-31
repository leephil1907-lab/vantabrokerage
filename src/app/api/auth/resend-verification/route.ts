import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { clientIp, fail, json, rateLimit } from '@/lib/http';
import { hashToken, requireUser } from '@/lib/auth';
import { emailConfigured, sendEventEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await rateLimit(`resend:${user.id}`, 5, 3600);
    const token = randomBytes(32).toString('base64url');
    await prisma.emailToken.create({ data: { userId: user.id, type: 'VERIFY_EMAIL', tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 86400_000) } });
    const delivery = await sendEventEmail(user.email, 'verify_email', { token }).catch(() => ({ delivered: false as const }));
    return json({ ok: true, delivery: { configured: emailConfigured(), delivered: delivery.delivered } });
  } catch (err) {
    return fail(err);
  }
}
