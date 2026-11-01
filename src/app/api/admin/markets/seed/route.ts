import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireStaff } from '@/lib/auth';
import { seedMarkets } from '../../../../../../prisma/seed-data';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/markets/seed — staff-only action that populates an empty
 * database with the reference instrument catalogue (forex, indices,
 * commodities, crypto spot/perp/short-expiry) plus the asset registry.
 * Markets only: it never creates users, accounts or credentials, so it is
 * safe to run against a production database from the back office.
 */
export async function POST() {
  try {
    await requireStaff();
    const existing = await prisma.tradingPair.count();
    const count = await seedMarkets(prisma);
    return json({ seeded: count, previous: existing, message: `Reference market catalogue upserted (${count} instruments).` });
  } catch (e) {
    return fail(e);
  }
}
