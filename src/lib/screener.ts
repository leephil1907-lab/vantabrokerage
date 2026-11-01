/**
 * TradingView scanner client (server-side only).
 *
 * Mirrors the request mechanics of github.com/deepentropy/tvscreener:
 * POST https://scanner.tradingview.com/{market}/scan with columns, filters,
 * sort and range; browser-like headers are required by the endpoint.
 * Results are reference market data from TradingView's public scanner and are
 * never presented as PRIMEVEST executable quotes.
 */
import 'server-only';

const SCANNER = 'https://scanner.tradingview.com';
const HEADERS = {
  'content-type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Origin: 'https://www.tradingview.com',
  Referer: 'https://www.tradingview.com/',
};

export const SCREENER_MARKETS = ['stocks', 'crypto', 'forex', 'cfd'] as const;
export type ScreenerMarket = (typeof SCREENER_MARKETS)[number];
const MARKET_PATH: Record<ScreenerMarket, string> = { stocks: 'america', crypto: 'crypto', forex: 'forex', cfd: 'cfd' };

export const SCREENER_PRESETS = ['gainers', 'losers', 'most_active', 'large_cap', 'strong_technicals', 'weak_technicals'] as const;
export type ScreenerPreset = (typeof SCREENER_PRESETS)[number];

export const PRESET_LABELS: Record<ScreenerPreset, string> = {
  gainers: 'Top gainers',
  losers: 'Top losers',
  most_active: 'Most active',
  large_cap: 'Large cap',
  strong_technicals: 'Technically strong',
  weak_technicals: 'Technically weak',
};

type Filter = { left: string; operation: string; right: unknown } | { left: string; operation: 'in_range' | 'not_in_range'; right: [number, number] };

const COLUMNS = [
  'name', 'description', 'close', 'change', 'volume', 'market_cap_basic',
  'sector', 'exchange', 'relative_volume_10d_calc', 'Recommend.All', 'type',
] as const;

export type ScreenerRow = {
  symbol: string; name: string; description: string; price: number | null;
  changePct: number | null; volume: number | null; marketCap: number | null;
  sector: string | null; exchange: string | null; relVolume: number | null;
  rating: number | null; type: string | null;
};

function presetFilters(market: ScreenerMarket, preset: ScreenerPreset): Filter[] {
  const f: Filter[] = [];
  if (market === 'stocks') {
    f.push({ left: 'is_primary', operation: 'equal', right: true });
    f.push({ left: 'market_cap_basic', operation: 'greater', right: 1_000_000_000 });
    f.push({ left: 'volume', operation: 'greater', right: 200_000 });
  }
  if (market === 'crypto') {
    f.push({ left: 'market_cap_calc', operation: 'greater', right: 100_000_000 });
    f.push({ left: 'volume', operation: 'greater', right: 1_000_000 });
  }
  if (market === 'forex') {
    // Restrict to G10 crosses at the scanner level: raw change-ranked forex is
    // dominated by exotic broker feeds (ARS/TRY/NGN crosses).
    f.push({ left: 'name', operation: 'match', right: '^(EUR|GBP|USD|JPY|CHF|AUD|CAD|NZD)(EUR|GBP|USD|JPY|CHF|AUD|CAD|NZD)$' });
    f.push({ left: 'volume', operation: 'greater', right: 0 });
  }
  if (market === 'cfd') f.push({ left: 'volume', operation: 'greater', right: 1000 });
  switch (preset) {
    case 'gainers': f.push({ left: 'change', operation: 'greater', right: 0 }); break;
    case 'losers': f.push({ left: 'change', operation: 'less', right: 0 }); break;
    case 'large_cap': f.push({ left: 'market_cap_basic', operation: 'greater', right: 50_000_000_000 }); break;
    case 'strong_technicals': f.push({ left: 'Recommend.All', operation: 'greater', right: 0.1 }); break;
    case 'weak_technicals': f.push({ left: 'Recommend.All', operation: 'less', right: -0.1 }); break;
    case 'most_active': break;
  }
  return f;
}

function presetSort(market: ScreenerMarket, preset: ScreenerPreset): { sortBy: string; sortOrder: 'desc' | 'asc' } {
  const cap = market === 'crypto' ? 'market_cap_calc' : 'market_cap_basic';
  switch (preset) {
    case 'gainers': return { sortBy: 'change', sortOrder: 'desc' };
    case 'losers': return { sortBy: 'change', sortOrder: 'asc' };
    case 'strong_technicals': return { sortBy: 'Recommend.All', sortOrder: 'desc' };
    case 'weak_technicals': return { sortBy: 'Recommend.All', sortOrder: 'asc' };
    case 'most_active': return { sortBy: 'volume', sortOrder: 'desc' };
    case 'large_cap': return { sortBy: cap, sortOrder: 'desc' };
  }
}

const cache = new Map<string, { at: number; rows: ScreenerRow[]; total: number }>();
const TTL = 60_000;

export async function runScreener(market: ScreenerMarket, preset: ScreenerPreset, start = 0, size = 25): Promise<{ rows: ScreenerRow[]; total: number; cached: boolean }> {
  const key = `${market}:${preset}:${start}:${size}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return { ...hit, cached: true };

  const want = market === 'forex' ? size * 4 : size;
  const body = {
    columns: [...COLUMNS],
    filter: presetFilters(market, preset),
    sort: presetSort(market, preset),
    range: [start, start + want],
    ...(market === 'stocks' ? { options: { lang: 'en' } } : {}),
  };
  const res = await fetch(`${SCANNER}/${MARKET_PATH[market]}/scan`, {
    method: 'POST', headers: HEADERS, body: JSON.stringify(body), signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`TradingView scanner responded ${res.status}`);
  const json = (await res.json()) as { totalCount: number; data: { s: string; d: (string | number | null)[] }[] };
  const rows: ScreenerRow[] = json.data.map((row) => ({
    symbol: row.s,
    name: String(row.d[1] ?? row.d[0] ?? ''),
    description: String(row.d[0] ?? ''),
    price: num(row.d[2]), changePct: num(row.d[3]), volume: num(row.d[4]), marketCap: num(row.d[5]),
    sector: row.d[6] == null ? null : String(row.d[6]),
    exchange: row.d[7] == null ? null : String(row.d[7]),
    relVolume: num(row.d[8]), rating: num(row.d[9]), type: row.d[10] == null ? null : String(row.d[10]),
  }));
  const cleaned = postProcess(market, rows, size);
  const out = { at: Date.now(), rows: cleaned, total: json.totalCount ?? rows.length };
  cache.set(key, out);
  return { rows: cleaned, total: out.total, cached: false };
}

/** Exchange-level dedupe for crypto and multi-broker forex feeds. */
function postProcess(market: ScreenerMarket, rows: ScreenerRow[], size: number): ScreenerRow[] {
  if (market === 'crypto') {
    const seen = new Set<string>();
    return rows.filter((r) => {
      const base = (r.symbol.split(':')[1] ?? r.symbol).replace(/[^A-Z]+$/g, (m) => m).slice(0, 12);
      const key = base.replace(/(USD|USDT|USD1|BUSD|EUR|GBP|JPY)$/, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, size);
  }
  if (market === 'forex') {
    // The same pair streams from many broker feeds — keep the first (best-ranked) listing per pair.
    const seen = new Set<string>();
    return rows.filter((r) => {
      const pair = (r.symbol.split(':')[1] ?? '').toUpperCase();
      if (!pair || seen.has(pair)) return false;
      seen.add(pair);
      return true;
    }).slice(0, size);
  }
  return rows.slice(0, size);
}

const num = (v: string | number | null | undefined) => (typeof v === 'number' && isFinite(v) ? v : null);
