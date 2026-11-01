import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { clientIp, fail, json, parseBody, rateLimit } from '@/lib/http';
import { hashToken } from '@/lib/auth';
import { queueTemplateEmail } from '@/lib/email';
import { resetRequestSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    await rateLimit(`forgot:${ip}`, 10, 3600);
    const { email } = await parseBody(req, resetRequestSchema);
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return ok to avoid account enumeration.
    if (!user) return json({ ok: true });
    const token = randomBytes(32).toString('base64url');
    await prisma.emailToken.create({ data: { userId: user.id, type: 'RESET_PASSWORD', tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3600_000) } });
    const link = `${process.env.APP_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;
    await queueTemplateEmail({ to: email, template: 'reset_password', variables: { actionUrl: link } });
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
