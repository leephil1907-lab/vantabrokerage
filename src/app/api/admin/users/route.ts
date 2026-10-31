import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireStaff } from '@/lib/auth';
import { d } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim();
    const status = url.searchParams.get('status');
    const users = await prisma.user.findMany({
      where: {
        ...(q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { referralCode: { contains: q.toUpperCase() } }, { profile: { firstName: { contains: q, mode: 'insensitive' } } }] } : {}),
        ...(status ? { status: status as never } : {}),
      },
      include: { profile: true, kyc: true, accounts: { include: { wallet: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return json({
      users: users.map((u) => ({
        id: u.id, email: u.email, role: u.role, status: u.status, emailVerified: !!u.emailVerifiedAt,
        createdAt: u.createdAt.toISOString(), lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        name: [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ') || '—',
        country: u.profile?.country ?? '—', kycStatus: u.kyc?.status ?? 'NOT_SUBMITTED',
        balances: u.accounts.map((a) => ({ type: a.type, available: d(a.wallet?.available as never), locked: d(a.wallet?.locked as never) })),
      })),
    });
  } catch (err) {
    return fail(err);
  }
}
