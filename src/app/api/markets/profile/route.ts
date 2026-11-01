import { NextResponse } from 'next/server';
import { companyProfile, finnhubConfigured, quote } from '@/lib/finnhub';

export const dynamic = 'force-dynamic';

/**
 * GET /api/markets/profile?symbol=NASDAQ:GDYN
 * Accepts a TradingView-style symbol or a bare US ticker and returns the
 * Finnhub company profile plus a live quote. Reference data only — never
 * presented as a PRIMEVEST executable instrument.
 */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('symbol') ?? '';
  const ticker = raw.trim().toUpperCase().split(':').pop() ?? '';
  if (!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(ticker)) {
    return NextResponse.json({ error: 'Invalid symbol.' }, { status: 400 });
  }
  if (!finnhubConfigured()) {
    return NextResponse.json({ provider: 'none', message: 'Company profiles require a Finnhub API key (FINNHUB_API_KEY).' });
  }
  try {
    const [profile, q] = await Promise.all([companyProfile(ticker), quote(ticker)]);
    const liveQuote = q && typeof q.c === 'number' && q.c > 0 ? q : null;
    if (!profile || !profile.name) {
      return NextResponse.json({ provider: 'finnhub', ticker, profile: null, quote: liveQuote, message: 'No company profile is available for this listing.' });
    }
    return NextResponse.json({ provider: 'finnhub', ticker, profile, quote: liveQuote });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status === 429 ? 429 : 502 });
  }
}
