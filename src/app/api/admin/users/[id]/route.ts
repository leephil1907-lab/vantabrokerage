import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { clientIp, fail, json, parseBody } from '@/lib/http';
import { requireStaff } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { d } from '@/lib/ledger';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true, kyc: true, accounts: { include: { wallet: true } },
        sessions: { where: { revokedAt: null }, orderBy: { lastSeenAt: 'desc' } },
        referrals: true, commissions: true,
      },
    });
    if (!user) throw new AppError('NOT_FOUND', 'User not found.', 404);
    const accountIds = user.accounts.map((a) => a.id);
    const [positions, orders, deposits, withdrawals, entries] = await Promise.all([
      prisma.position.findMany({ where: { accountId: { in: accountIds } }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.order.findMany({ where: { accountId: { in: accountIds } }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.deposit.findMany({ where: { wallet: { accountId: { in: accountIds } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.withdrawal.findMany({ where: { wallet: { accountId: { in: accountIds } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.ledgerEntry.findMany({ where: { wallet: { accountId: { in: accountIds } } }, include: { transaction: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    return json({
      user: {
        id: user.id, email: user.email, role: user.role, status: user.status, emailVerified: !!user.emailVerifiedAt,
        twoFactorEnabled: user.twoFactorEnabled, referralCode: user.referralCode, createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null, lastLoginIp: user.lastLoginIp, profile: user.profile, kyc: user.kyc,
        accounts: user.accounts.map((a) => ({ id: a.id, type: a.type, currency: a.currency, leverage: a.leverage, available: d(a.wallet?.available as never), locked: d(a.wallet?.locked as never) })),
        sessions: user.sessions.map((s) => ({ id: s.id, device: s.device, ip: s.ip, lastSeenAt: s.lastSeenAt.toISOString() })),
      },
      activity: {
        positions: positions.map((p) => ({ id: p.id, symbol: p.symbol, side: p.side, qty: d(p.qty), entryPrice: d(p.entryPrice), status: p.status, realizedPnl: d(p.realizedPnl), createdAt: p.createdAt.toISOString() })),
        orders: orders.map((o) => ({ id: o.id, symbol: o.symbol, side: o.side, type: o.type, qty: d(o.qty), status: o.status, createdAt: o.createdAt.toISOString() })),
        deposits: deposits.map((x) => ({ id: x.id, asset: x.asset, amount: d(x.amount), status: x.status, createdAt: x.createdAt.toISOString() })),
        withdrawals: withdrawals.map((x) => ({ id: x.id, asset: x.asset, amount: d(x.amount), status: x.status, createdAt: x.createdAt.toISOString() })),
        ledger: entries.map((e) => ({ id: e.id, direction: e.direction, amount: d(e.amount), type: e.transaction.type, description: e.transaction.description, createdAt: e.createdAt.toISOString() })),
      },
    });
  } catch (err) {
    return fail(err);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    const { id } = await ctx.params;
    const body = await parseBody(req, z.object({ status: z.enum(['PENDING', 'ACTIVE', 'RESTRICTED', 'SUSPENDED', 'CLOSED']).optional(), role: z.enum(['USER', 'SUPPORT', 'FINANCE', 'ADMIN', 'SUPERADMIN']).optional(), note: z.string().max(500).optional() }));
    if (body.role && staff.role !== 'SUPERADMIN' && staff.role !== 'ADMIN') throw new AppError('FORBIDDEN', 'Only administrators may change roles.', 403);
    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) throw new AppError('NOT_FOUND', 'User not found.', 404);
    const updated = await prisma.user.update({ where: { id }, data: { ...(body.status ? { status: body.status } : {}), ...(body.role ? { role: body.role } : {}) } });
    if (body.status && ['SUSPENDED', 'CLOSED'].includes(body.status)) {
      await prisma.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await audit({ actorId: staff.id, action: 'user.update', targetType: 'User', targetId: id, before: { status: before.status, role: before.role }, after: { status: updated.status, role: updated.role, note: body.note }, ip: clientIp(req), userAgent: req.headers.get('user-agent') ?? undefined });
    return json({ ok: true, user: { id: updated.id, status: updated.status, role: updated.role } });
  } catch (err) {
    return fail(err);
  }
}
