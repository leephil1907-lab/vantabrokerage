import 'server-only';

/** Read-only discovery data. Never used for order execution or position valuation. */
export type CryptoDiscoveryAsset = {
  id: string; symbol: string; name: string; image: string | null;
  rank: number | null; priceUsd: number | null; change24h: number | null;
  marketCap: number | null; volume24h: number | null; updatedAt: string | null;
};
export type CryptoDiscoveryResponse = {
  assets: CryptoDiscoveryAsset[]; source: 'CoinGecko'; fetchedAt: string; stale: boolean;
};

const API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false';
const CACHE_MS = 60_000;
const MAX_STALE_MS = 30 * 60_000;
const RETRY_MS = 20_000;
let cache: CryptoDiscoveryResponse | null = null;
let pending: Promise<CryptoDiscoveryResponse> | null = null;
let retryAfter = 0;

const numeric = (x: unknown): number | null => typeof x === 'number' && Number.isFinite(x) ? x : null;
function imageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'coin-images.coingecko.com' ? url.href : null;
  } catch { return null; }
}

export function parseCryptoAssets(raw: unknown): CryptoDiscoveryAsset[] {
  if (!Array.isArray(raw)) throw new Error('Unexpected CoinGecko response');
  return raw.flatMap((item): CryptoDiscoveryAsset[] => {
    if (!item || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.symbol !== 'string') return [];
    const parsed = typeof item.last_updated === 'string' ? Date.parse(item.last_updated) : NaN;
    return [{
      id: item.id.slice(0, 150), symbol: item.symbol.slice(0, 24).toUpperCase(), name: item.name.slice(0, 100),
      image: imageUrl(item.image), rank: numeric(item.market_cap_rank), priceUsd: numeric(item.current_price),
      change24h: numeric(item.price_change_percentage_24h), marketCap: numeric(item.market_cap),
      volume24h: numeric(item.total_volume), updatedAt: Number.isFinite(parsed) ? new Date(parsed).toISOString() : null,
    }];
  });
}

async function refresh(): Promise<CryptoDiscoveryResponse> {
  const headers: Record<string, string> = { Accept: 'application/json', 'User-Agent': 'PRIMEVEST/1.0' };
  if (process.env.COINGECKO_DEMO_API_KEY) headers['x-cg-demo-api-key'] = process.env.COINGECKO_DEMO_API_KEY;
  const response = await fetch(API_URL, { headers, cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`CoinGecko responded ${response.status}`);
  const assets = parseCryptoAssets(await response.json());
  if (!assets.length) throw new Error('CoinGecko returned no assets');
  const next: CryptoDiscoveryResponse = { assets, source: 'CoinGecko', fetchedAt: new Date().toISOString(), stale: false };
  cache = next;
  return next;
}

export async function getCryptoDiscovery(): Promise<CryptoDiscoveryResponse> {
  const age = cache ? Date.now() - Date.parse(cache.fetchedAt) : Infinity;
  if (cache && age < CACHE_MS) return cache;
  if (pending) return pending;
  if (Date.now() < retryAfter) {
    if (cache && age < MAX_STALE_MS) return { ...cache, stale: true };
    throw new Error('CoinGecko temporarily unavailable');
  }
  pending = refresh().catch((error) => {
    retryAfter = Date.now() + RETRY_MS;
    if (cache && Date.now() - Date.parse(cache.fetchedAt) < MAX_STALE_MS) return { ...cache, stale: true };
    throw error;
  }).finally(() => { pending = null; });
  return pending;
}
