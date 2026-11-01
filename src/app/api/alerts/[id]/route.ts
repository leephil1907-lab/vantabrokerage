import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const alert = await prisma.priceAlert.findUnique({ where: { id } });
    if (!alert || alert.userId !== user.id) throw new AppError('NOT_FOUND', 'Alert not found.', 404);
    await prisma.priceAlert.delete({ where: { id } });
    return json({ ok: true });
  } catch (err) { return fail(err); }
}
