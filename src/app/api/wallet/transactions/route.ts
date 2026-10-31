import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { getAccountForUser } from '@/lib/accounts';
import { d } from '@/lib/ledger';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const account = await getAccountForUser(user.id, url.searchParams.get('accountId') ?? undefined);
    const wallet = await prisma.wallet.findUnique({ where: { accountId: account.id } });
    if (!wallet) return json({ entries: [], available: 0, locked: 0 });
    const entries = await prisma.ledgerEntry.findMany({
      where: { walletId: wallet.id },
      include: { transaction: true },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(url.searchParams.get('limit') ?? 100), 500),
    });
    return json({
      available: d(wallet.available),
      locked: d(wallet.locked),
      entries: entries.map((e) => ({
        id: e.id, direction: e.direction, amount: d(e.amount), balanceAfter: d(e.balanceAfter),
        type: e.transaction.type, status: e.transaction.status, description: e.transaction.description,
        reference: e.transaction.reference, metadata: e.transaction.metadata, createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return fail(err);
  }
}
