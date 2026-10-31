import { NextRequest } from 'next/server';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { cancelOrder } from '@/lib/execution';

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const order = await cancelOrder(user.id, id);
    return json({ ok: true, order: { id: order.id, status: order.status } });
  } catch (err) {
    return fail(err);
  }
}
