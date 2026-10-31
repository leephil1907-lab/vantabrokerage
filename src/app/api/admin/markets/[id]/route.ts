import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { clientIp, fail, json, parseBody } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { AppError } from '@/lib/errors';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await parseBody(req, z.object({
      enabled: z.boolean().optional(),
      maxLeverage: z.coerce.number().int().min(1).max(200).optional(),
      takerFee: z.coerce.number().min(0).max(0.05).optional(),
      payoutRate: z.coerce.number().min(0).max(0.95).nullable().optional(),
    }));
    const before = await prisma.tradingPair.findUnique({ where: { id } });
    if (!before) throw new AppError('NOT_FOUND', 'Market not found.', 404);
    const updated = await prisma.tradingPair.update({
      where: { id },
      data: {
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.maxLeverage !== undefined ? { maxLeverage: body.maxLeverage } : {}),
        ...(body.takerFee !== undefined ? { takerFee: String(body.takerFee) } : {}),
        ...(body.payoutRate !== undefined ? { payoutRate: body.payoutRate === null ? null : String(body.payoutRate) } : {}),
      },
    });
    await audit({ actorId: admin.id, action: 'market.update', targetType: 'TradingPair', targetId: id, before: { enabled: before.enabled, maxLeverage: before.maxLeverage, takerFee: before.takerFee }, after: body, ip: clientIp(req) });
    return json({ ok: true, market: { id: updated.id, enabled: updated.enabled, maxLeverage: updated.maxLeverage } });
  } catch (err) {
    return fail(err);
  }
}
