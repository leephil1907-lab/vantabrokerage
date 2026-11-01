import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { ensureAccounts, accountEquity, createPaperAccount } from '@/lib/accounts';
import { prisma } from '@/lib/db';
import { d } from '@/lib/ledger';

export async function POST() {
  try {
    const user = await requireUser();
    const account = await createPaperAccount(user.id);
    const wallet = await prisma.wallet.findUnique({ where: { accountId: account.id } });
    return json({ account: { id: account.id, type: account.type, currency: account.currency, available: d(wallet?.available), locked: d(wallet?.locked) } }, { status: 201 });
  } catch (err) { return fail(err); }
}

export async function GET() {
  try {
    const user = await requireUser();
    await ensureAccounts(user.id);
    const accounts = await prisma.account.findMany({ where: { userId: user.id, type: { in: ['LIVE', 'PAPER'] } }, include: { wallet: true }, orderBy: { type: 'asc' } });
    const withEquity = await Promise.all(
      accounts.map(async (a) => ({ ...a, equity: await accountEquity(a.id) })),
    );
    return json({
      accounts: withEquity.map((a) => ({
        id: a.id, type: a.type, status: a.status, currency: a.currency, leverage: a.leverage, isDefault: a.isDefault,
        available: d(a.wallet?.available as never), locked: d(a.wallet?.locked as never),
        holdings: [], equity: a.equity,
      })),
      liveExecutionEnabled: true,
    });
  } catch (err) {
    return fail(err);
  }
}
