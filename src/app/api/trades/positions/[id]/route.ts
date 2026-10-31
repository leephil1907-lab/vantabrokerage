import { NextRequest } from 'next/server';
import { z } from 'zod';
import { fail, json, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { closePosition } from '@/lib/execution';

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const result = await closePosition({ userId: user.id, positionId: id, reason: 'manual' });
    return json({ ok: true, ...result });
  } catch (err) {
    return fail(err);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await parseBody(req, z.object({ takeProfit: z.coerce.number().positive().nullable().optional(), stopLoss: z.coerce.number().positive().nullable().optional() }));
    const { prisma } = await import('@/lib/db');
    const pos = await prisma.position.findUnique({ where: { id }, include: { account: true } });
    if (!pos || pos.account.userId !== user.id) return json({ error: { code: 'FORBIDDEN', message: 'Position not found.' } }, { status: 404 });
    const updated = await prisma.position.update({
      where: { id },
      data: {
        ...(body.takeProfit !== undefined ? { takeProfit: body.takeProfit === null ? null : String(body.takeProfit) } : {}),
        ...(body.stopLoss !== undefined ? { stopLoss: body.stopLoss === null ? null : String(body.stopLoss) } : {}),
      },
    });
    return json({ ok: true, position: { id: updated.id, takeProfit: updated.takeProfit ? Number(updated.takeProfit) : null, stopLoss: updated.stopLoss ? Number(updated.stopLoss) : null } });
  } catch (err) {
    return fail(err);
  }
}
