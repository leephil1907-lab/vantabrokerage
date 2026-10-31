import { verifyToken, generateSecret, otpauthUrl } from '@/lib/totp';
import QRCode from 'qrcode';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';

export async function POST() {
  try {
    const user = await requireUser();
    const secret = generateSecret();
    const otpauth = otpauthUrl(secret, user.email);
    const qr = await QRCode.toDataURL(otpauth);
    // Stored but not enabled until a valid code is confirmed.
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret, twoFactorEnabled: false } });
    return json({ secret, otpauth, qr });
  } catch (err) {
    return fail(err);
  }
}
