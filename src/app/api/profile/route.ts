import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { fail, json, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { passwordSchema } from '@/lib/validation';
import { notifyUserByEmail } from '@/lib/email';

const profileSchema = z.object({
  firstName: z.string().trim().max(60).optional(),
  lastName: z.string().trim().max(60).optional(),
  phone: z.string().trim().max(32).optional(),
  country: z.string().trim().max(60).optional(),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(20).optional(),
  timezone: z.string().trim().max(60).optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const u = await prisma.user.findUnique({ where: { id: user.id }, include: { profile: true, kyc: true } });
    return json({
      user: {
        id: u!.id, email: u!.email, role: u!.role, status: u!.status, emailVerified: !!u!.emailVerifiedAt,
        twoFactorEnabled: u!.twoFactorEnabled, referralCode: u!.referralCode, createdAt: u!.createdAt.toISOString(),
        profile: u!.profile, kycStatus: u!.kyc?.status ?? 'NOT_SUBMITTED',
      },
    });
  } catch (err) {
    return fail(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await parseBody(req, profileSchema);
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...body, preferences: (body.preferences ?? {}) as never },
      update: { ...body, ...(body.preferences ? { preferences: body.preferences as never } : {}) } as never,
    });
    return json({ ok: true, profile });
  } catch (err) {
    return fail(err);
  }
}

export async function PUT(req: NextRequest) {
  // Password change
  try {
    const user = await requireUser();
    const body = await parseBody(req, z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema }));
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !(await bcrypt.compare(body.currentPassword, dbUser.passwordHash))) {
      throw new AppError('INVALID_CREDENTIALS', 'Current password is incorrect.', 401);
    }
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(body.newPassword, 12) } });
    await prisma.session.updateMany({ where: { userId: user.id, id: { not: user.sessionId }, revokedAt: null }, data: { revokedAt: new Date() } });
    await prisma.notification.create({ data: { userId: user.id, type: 'SECURITY', title: 'Password changed', body: 'Your password was updated and other sessions were signed out.' } });
    await notifyUserByEmail(user.id, 'password_changed');
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
