import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fail, json, parseBody, rateLimit } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { placeOrder, matchRestingOrders } from '@/lib/execution';
import { getAccountForUser } from '@/lib/accounts';
import { serializeOrder } from '@/lib/serialize';
import { queueTemplateEmail } from '@/lib/email';

const orderSchema = z.object({
  accountId: z.string().min(1),
  symbol: z.string().min(1),
  side: z.enum(['BUY', 'SELL']),
  type: z.enum(['MARKET', 'LIMIT', 'STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET']),
  qty: z.coerce.number().positive(),
  price: z.coerce.number().positive().optional(),
  leverage: z.coerce.number().int().min(1).max(200).optional(),
  marginMode: z.enum(['CROSS', 'ISOLATED']).optional(),
  takeProfit: z.coerce.number().positive().optional(),
  stopLoss: z.coerce.number().positive().optional(),
  reduceOnly: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await rateLimit(`order:${user.id}`, 30, 60);
    const body = await parseBody(req, orderSchema);
    const result = await placeOrder({ userId: user.id, ...body });
    if (result.filled) {
      const accountOwner = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, profile: { select: { firstName: true } } } });
      if (accountOwner) await queueTemplateEmail({ to: accountOwner.email, template: 'trade_executed', variables: { firstName: accountOwner.profile?.firstName ?? undefined, symbol: result.order.symbol, side: result.order.side, quantity: String(result.order.filledQty), averagePrice: String(result.order.avgFillPrice ?? '') } }).catch((error) => console.error('[trade execution email]', error));
    }
    // Resting orders may already be marketable — try to match immediately.
    if (!result.filled) matchRestingOrders(body.symbol).catch(() => undefined);
    return json({
      order: serializeOrder(result.order),
      filled: result.filled,
      quote: result.quote,
      executionMode: 'paper',
    }, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const account = await getAccountForUser(user.id, url.searchParams.get('accountId') ?? undefined);
    const status = url.searchParams.get('status');
    const orders = await prisma.order.findMany({
      where: { accountId: account.id, ...(status === 'open' ? { status: 'OPEN' } : status === 'history' ? { status: { not: 'OPEN' } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { fills: true },
    });
    return json({ orders: orders.map(serializeOrder), account: { id: account.id, type: account.type } });
  } catch (err) {
    return fail(err);
  }
}
