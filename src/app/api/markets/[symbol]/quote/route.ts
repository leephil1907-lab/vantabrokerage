import { NextRequest } from 'next/server';
import { fail, json } from '@/lib/http';
import { quoteFor } from '@/lib/markets';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await ctx.params;
    const quote = await quoteFor(decodeURIComponent(symbol));
    if (!quote) throw new AppError('NOT_FOUND', 'Market not found.', 404);
    return json(quote, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return fail(err);
  }
}
