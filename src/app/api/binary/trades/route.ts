import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fail, json, parseBody, rateLimit } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { openBinaryTrade, settleExpiredBinaryTrades } from '@/lib/binary';
import { getAccountForUser } from '@/lib/accounts';
import { d } from '@/lib/ledger';

const schema = z.object({
  accountId: z.string().min(1),
  symbol: z.string().min(1),
  direction: z.enum(['CALL', 'PUT']),
  stake: z.coerce.number().positive(),
  expirySeconds: z.coerce.number().int().positive(),
});

export const dynamic = 'force-dynamic';

async function serialize(t: {
  id: string; symbol: string; direction: string; stake: unknown; payoutRate: unknown; entryPrice: unknown; settlePrice: unknown; result: string;
  pnl: unknown; expiresAt: Date; settledAt: Date | null; env: string; entryQuoteTs: Date; exitQuoteTs: Date | null;
}) {
  return {
    id: t.id, symbol: t.symbol, direction: t.direction, stake: d(t.stake as never), payoutRate: d(t.payoutRate as never),
    entryPrice: d(t.entryPrice as never), settlePrice: t.settlePrice != null ? d(t.settlePrice as never) : null,
    result: t.result, pnl: d(t.pnl as never), expiresAt: t.expiresAt.toISOString(), settledAt: t.settledAt?.toISOString() ?? null,
    env: t.env, entryQuoteTs: t.entryQuoteTs.toISOString(), exitQuoteTs: t.exitQuoteTs?.toISOString() ?? null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await rateLimit(`binary:${user.id}`, 20, 60);
    const body = await parseBody(req, schema);
    const trade = await openBinaryTrade({ userId: user.id, ...body });
    return json({ trade: await serialize(trade) }, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const account = await getAccountForUser(user.id, url.searchParams.get('accountId') ?? undefined);
    // Settle anything expired on read so the panel stays consistent even without the worker.
    await settleExpiredBinaryTrades().catch(() => undefined);
    const trades = await prisma.binaryTrade.findMany({ where: { accountId: account.id }, orderBy: { createdAt: 'desc' }, take: 100 });
    const open = trades.filter((t) => t.result === 'OPEN');
    const settled = trades.filter((t) => t.result !== 'OPEN');
    return json({
      account: { id: account.id, type: account.type },
      open: await Promise.all(open.map(serialize)),
      settled: await Promise.all(settled.map(serialize)),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return fail(err);
  }
}
