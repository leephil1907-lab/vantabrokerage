import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireStaff } from '@/lib/auth';
import { d } from '@/lib/ledger';
import { emailConfigured } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireStaff();
    const [users, activeUsers, pendingKyc, deposits, withdrawals, positions, orders, trades, audits] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 7 * 86400_000) } } }),
      prisma.kycRecord.count({ where: { status: 'PENDING' } }),
      prisma.deposit.findMany({ where: { status: 'CREDITED' } }),
      prisma.withdrawal.findMany({ where: { status: { in: ['COMPLETED', 'PROCESSING', 'APPROVED'] } } }),
      prisma.position.count({ where: { status: 'OPEN' } }),
      prisma.order.count(),
      prisma.execution.findMany({ select: { price: true, qty: true, fee: true } }),
      prisma.adminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { actor: { select: { email: true } } } }),
    ]);
    const volume = trades.reduce((s, t) => s + d(t.price) * d(t.qty), 0);
    const fees = trades.reduce((s, t) => s + d(t.fee), 0);
    const totalDeposits = deposits.reduce((s, x) => s + d(x.creditedAmount ?? x.amount), 0);
    const totalWithdrawals = withdrawals.reduce((s, x) => s + d(x.amount), 0);
    const pendingWithdrawals = await prisma.withdrawal.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } });
    const pendingDeposits = await prisma.deposit.count({ where: { status: { in: ['PENDING', 'CONFIRMING'] } } });
    const openTickets = await prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'PENDING_CUSTOMER'] } } });
    return json({
      totals: {
        users, activeUsers, pendingKyc, totalDeposits, totalWithdrawals, volume, fees: Math.round(fees * 100) / 100,
        openPositions: positions, orders, pendingWithdrawals, pendingDeposits, openTickets,
      },
      health: {
        database: 'ok',
        marketDataMode: process.env.MARKET_DATA_MODE ?? 'live',
        executionMode: 'paper',
        emailProvider: emailConfigured() ? 'configured' : 'not-configured',
        custodyProvider: process.env.CUSTODY_PROVIDER ?? 'not-configured',
        paymentProvider: process.env.PAYMENT_PROVIDER ?? 'not-configured',
        kycProvider: process.env.KYC_PROVIDER ?? 'manual-review',
        redis: process.env.REDIS_URL ? 'configured' : 'postgres-rate-limiter',
      },
      recentAudit: audits.map((a) => ({ id: a.id, action: a.action, targetType: a.targetType, targetId: a.targetId, actor: a.actor.email, createdAt: a.createdAt.toISOString() })),
    });
  } catch (err) {
    return fail(err);
  }
}
