import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { ensureAccounts, accountEquity } from '@/lib/accounts';
import { prisma } from '@/lib/db';
import { d } from '@/lib/ledger';

export async function GET() {
  try {
    const user = await requireUser();
    await ensureAccounts(user.id);
    const accounts = await prisma.account.findMany({ where: { userId: user.id }, include: { wallet: true }, orderBy: { type: 'asc' } });
    const withEquity = await Promise.all(
      accounts.map(async (a) => ({ ...a, equity: await accountEquity(a.id) })),
    );
    return json({
      accounts: withEquity.map((a) => ({
        id: a.id, type: a.type, status: a.status, currency: a.currency, leverage: a.leverage, isDefault: a.isDefault,
        available: d(a.wallet?.available as never), locked: d(a.wallet?.locked as never),
        holdings: [], equity: a.equity,
      })),
      liveExecutionEnabled: process.env.EXECUTION_MODE === 'live',
    });
  } catch (err) {
    return fail(err);
  }
}
