import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { d } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

/** Copy-trading directory. Metrics are derived from verified execution data only. */
export async function GET() {
  try {
    const user = await requireUser();
    const traders = await prisma.copyTrader.findMany({ include: { user: { select: { email: true } } }, orderBy: { roi30d: 'desc' } });
    const following = await prisma.copyRelationship.findMany({ where: { followerId: user.id } });
    const enriched = await Promise.all(
      traders.map(async (t) => {
        const [closed, wins] = await Promise.all([
          prisma.position.findMany({ where: { account: { userId: t.userId }, status: 'CLOSED' }, select: { realizedPnl: true } }),
          prisma.position.count({ where: { account: { userId: t.userId }, status: 'CLOSED', realizedPnl: { gt: 0 } } }),
        ]);
        const total = closed.reduce((s, p) => s + d(p.realizedPnl), 0);
        const winRate = closed.length ? (wins / closed.length) * 100 : 0;
        const rel = following.find((f) => f.copyTraderId === t.id);
        return {
          id: t.id,
          displayName: t.displayName,
          strategy: t.strategy,
          bio: t.bio,
          verified: t.verified,
          riskLevel: t.riskLevel,
          followerCount: t.followerCount,
          verifiedTrades: closed.length,
          verifiedPnl: Math.round(total * 100) / 100,
          winRate: Math.round(winRate * 10) / 10,
          metricsSource: 'verified-execution',
          following: rel ? { id: rel.id, status: rel.status, allocation: d(rel.allocation), maxExposure: d(rel.maxExposure) } : null,
        };
      }),
    );
    return json({ traders: enriched, canPublishTraders: false });
  } catch (err) {
    return fail(err);
  }
}
