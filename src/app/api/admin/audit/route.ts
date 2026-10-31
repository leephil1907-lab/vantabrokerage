import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const take = Math.min(Number(url.searchParams.get('take') ?? 100), 300);
    const logs = await prisma.adminAuditLog.findMany({ include: { actor: { select: { email: true, role: true } } }, orderBy: { createdAt: 'desc' }, take });
    return json({
      logs: logs.map((l) => ({
        id: l.id, actor: l.actor.email, role: l.actor.role, action: l.action, targetType: l.targetType, targetId: l.targetId,
        before: l.before, after: l.after, ip: l.ip, createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return fail(err);
  }
}
