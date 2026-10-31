import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fail, json, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { listMarkets } from '@/lib/markets';

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.watchlistItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
    const markets = items.length ? await listMarkets({ symbols: items.map((i) => i.symbol) }) : [];
    return json({ symbols: items.map((i) => i.symbol), markets });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { symbol, action } = await parseBody(req, z.object({ symbol: z.string().min(1), action: z.enum(['add', 'remove', 'toggle']).default('toggle') }));
    const exists = await prisma.watchlistItem.findUnique({ where: { userId_symbol: { userId: user.id, symbol } } });
    if (action === 'remove' || (action === 'toggle' && exists)) {
      if (exists) await prisma.watchlistItem.delete({ where: { id: exists.id } });
      return json({ watching: false });
    }
    const pair = await prisma.tradingPair.findUnique({ where: { symbol } });
    if (!pair) return json({ error: { code: 'NOT_FOUND', message: 'Market not found.' } }, { status: 404 });
    await prisma.watchlistItem.upsert({ where: { userId_symbol: { userId: user.id, symbol } }, create: { userId: user.id, symbol }, update: {} });
    return json({ watching: true });
  } catch (err) {
    return fail(err);
  }
}
