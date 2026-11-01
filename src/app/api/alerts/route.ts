import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { d } from '@/lib/ledger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  symbol: z.string().min(1).max(24),
  direction: z.enum(['ABOVE', 'BELOW']),
  threshold: z.number().positive().finite(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const alerts = await prisma.priceAlert.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 });
    return json({ alerts: alerts.map((a) => ({ id: a.id, symbol: a.symbol, direction: a.direction, threshold: d(a.threshold), triggered: a.triggered, triggeredAt: a.triggeredAt?.toISOString() ?? null, createdAt: a.createdAt.toISOString() })) });
  } catch (err) { return fail(err); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await req.json());
    const pair = await prisma.tradingPair.findUnique({ where: { symbol: body.symbol } });
    if (!pair || !pair.enabled) throw new AppError('NOT_FOUND', `Market ${body.symbol} is not available for alerts.`, 404);
    const count = await prisma.priceAlert.count({ where: { userId: user.id, triggered: false } });
    if (count >= 50) throw new AppError('LIMIT_REACHED', 'You can have up to 50 active alerts.', 429);
    const alert = await prisma.priceAlert.create({ data: { userId: user.id, symbol: body.symbol, direction: body.direction, threshold: String(body.threshold) } });
    return json({ alert: { id: alert.id, symbol: alert.symbol, direction: alert.direction, threshold: d(alert.threshold), triggered: false } }, { status: 201 });
  } catch (err) { return fail(err); }
}
