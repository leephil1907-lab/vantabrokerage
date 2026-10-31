import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { d } from '@/lib/ledger';

export async function GET() {
  try {
    const user = await requireUser();
    const bonuses = await prisma.bonus.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    const campaigns = await prisma.systemConfig.findMany({ where: { category: 'bonus' } });
    return json({
      bonuses: bonuses.map((b) => ({ id: b.id, code: b.code, amount: d(b.amount), turnoverRequired: d(b.turnoverRequired), turnoverDone: d(b.turnoverDone), status: b.status, expiresAt: b.expiresAt?.toISOString() ?? null, createdAt: b.createdAt.toISOString() })),
      campaigns: campaigns.map((c) => ({ key: c.key, value: c.value })),
    });
  } catch (err) {
    return fail(err);
  }
}
