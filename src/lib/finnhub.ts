/**
 * Finnhub client (server-side only), modelled on the official clients
 * (Finnhub-Stock-API/finnhub-python, m1/go-finnhub) and the public API docs.
 *
 * Activation is opt-in: set FINNHUB_API_KEY in the environment. Without a key
 * every helper reports `configured: false` and callers fall back to the
 * platform's own reference-data briefs. The free tier allows ~60 calls/minute,
 * so responses are cached in-process for five minutes.
 */
import 'server-only';

const BASE = 'https://finnhub.io/api/v1';
const TTL = 5 * 60_000;
const cache = new Map<string, { at: number; value: unknown }>();

export function finnhubConfigured() {
  return !!process.env.FINNHUB_API_KEY;
}

async function get<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
  const key = path + JSON.stringify(params);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  url.searchParams.set('token', process.env.FINNHUB_API_KEY ?? '');
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { 'X-Finnhub-Token': process.env.FINNHUB_API_KEY ?? '' } });
  if (res.status === 429) throw Object.assign(new Error('Finnhub rate limit reached. Try again shortly.'), { status: 429 });
  if (!res.ok) throw new Error(`Finnhub responded ${res.status}`);
  const value = (await res.json()) as T;
  cache.set(key, { at: Date.now(), value });
  return value;
}

export type NewsItem = { id: string; headline: string; summary: string; source: string; url: string; publishedAt: string; symbol?: string; category?: string };

/** General/market news: GET /news?category=general|forex|crypto|merger */
export async function topNews(category: 'general' | 'forex' | 'crypto' | 'merger' = 'general'): Promise<NewsItem[]> {
  const raw = await get<{ id: number; headline: string; summary: string; source: string; url: string; datetime: number; category?: string }[]>('/news', { category });
  return raw.slice(0, 20).map((n) => ({ id: String(n.id), headline: n.headline, summary: n.summary ?? '', source: n.source, url: n.url, publishedAt: new Date(n.datetime * 1000).toISOString(), category: n.category }));
}

/** Company news: GET /company-news?symbol=&from=&to= */
export async function companyNews(symbol: string, days = 7): Promise<NewsItem[]> {
  const to = new Date(); const from = new Date(Date.now() - days * 86_400_000);
  const raw = await get<{ id: number; headline: string; summary: string; source: string; url: string; datetime: number; symbol?: string }[]>('/company-news', { symbol, from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) });
  return raw.slice(0, 20).map((n) => ({ id: String(n.id), headline: n.headline, summary: n.summary ?? '', source: n.source, url: n.url, publishedAt: new Date(n.datetime * 1000).toISOString(), symbol: n.symbol }));
}

/** Company profile: GET /stock/profile2?symbol= (marketCapitalization and shareOutstanding are in millions) */
export async function companyProfile(symbol: string) {
  return get<{
    country?: string; currency?: string; exchange?: string; finnhubIndustry?: string;
    ipo?: string; logo?: string; marketCapitalization?: number; name?: string;
    phone?: string; shareOutstanding?: number; ticker?: string; weburl?: string;
  } | null>('/stock/profile2', { symbol });
}

/** Quote: GET /quote?symbol= */
export async function quote(symbol: string) {
  return get<{ c?: number; d?: number; dp?: number; h?: number; l?: number; o?: number; pc?: number }>('/quote', { symbol });
}

export type EarningsEvent = { symbol: string; date: string; hour: string; quarter: number; year: number; epsEstimate: number | null; revenueEstimate: number | null };
let earnCache: { at: number; events: EarningsEvent[] } | null = null;

/** Forward earnings calendar (Finnhub free tier). Empty when unavailable — never synthetic. */
export async function earningsCalendar(daysAhead = 5): Promise<EarningsEvent[]> {
  if (!finnhubConfigured()) return [];
  if (earnCache && Date.now() - earnCache.at < 10 * 60_000) return earnCache.events;
  const from = new Date(); from.setUTCHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + daysAhead * 86_400_000);
  const fmtD = (d: Date) => d.toISOString().slice(0, 10);
  const url = `https://finnhub.io/api/v1/calendar/earnings?from=${fmtD(from)}&to=${fmtD(to)}&token=${process.env.FINNHUB_API_KEY}`;
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10_000) }).catch(() => null);
  if (!res || !res.ok) return earnCache?.events ?? [];
  const payload = await res.json().catch(() => null) as { earningsCalendar?: unknown } | null;
  if (!payload || !Array.isArray(payload.earningsCalendar)) return earnCache?.events ?? [];
  const events = payload.earningsCalendar.flatMap((row: unknown) => {
    if (typeof row !== 'object' || row === null) return [];
    const r = row as Record<string, unknown>;
    if (typeof r.symbol !== 'string' || typeof r.date !== 'string') return [];
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    return [{ symbol: r.symbol, date: r.date, hour: typeof r.hour === 'string' ? r.hour : '', quarter: typeof r.quarter === 'number' ? r.quarter : 0, year: typeof r.year === 'number' ? r.year : 0, epsEstimate: num(r.epsEstimate), revenueEstimate: num(r.revenueEstimate) }];
  }).sort((a, b) => a.date.localeCompare(b.date) || a.symbol.localeCompare(b.symbol)).slice(0, 30) as EarningsEvent[];
  earnCache = { at: Date.now(), events };
  return events;
}
