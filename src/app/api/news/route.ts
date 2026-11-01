import { NextRequest } from 'next/server';
import { fail, json } from '@/lib/http';
import { finnhubConfigured, topNews, companyNews } from '@/lib/finnhub';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    if (!finnhubConfigured()) {
      return json({ provider: 'none', items: [], message: 'Editorial news requires a Finnhub API key (FINNHUB_API_KEY). Reference-data briefs remain available.' });
    }
    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol');
    const category = (url.searchParams.get('category') ?? 'general') as 'general' | 'forex' | 'crypto' | 'merger';
    const items = symbol ? await companyNews(symbol.toUpperCase()) : await topNews(category);
    return json({ provider: 'finnhub', symbol: symbol ?? null, category, items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) { return fail(err); }
}
