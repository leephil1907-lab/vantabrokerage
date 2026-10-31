import { fail, json } from '@/lib/http';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return json({ user: null });
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, role: true, status: true, emailVerifiedAt: true, twoFactorEnabled: true, referralCode: true, profile: true, kyc: { select: { status: true, level: true } } },
    });
    return json({ user, emailVerified: !!user?.emailVerifiedAt });
  } catch (err) {
    return fail(err);
  }
}
