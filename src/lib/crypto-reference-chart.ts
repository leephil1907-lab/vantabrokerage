import 'server-only';

/** Read-only CoinGecko USD reference history. This data is never used for execution. */
export const REFERENCE_ASSETS = ['bitcoin', 'ethereum', 'solana'] as const;
export type ReferenceAsset = (typeof REFERENCE_ASSETS)[number];
type Result = { asset: ReferenceAsset; currency: 'USD'; source: 'CoinGecko'; fetchedAt: string; stale: boolean; prices: { time: number; price: number }[] };
const cache = new Map<ReferenceAsset, Result>();
const pending = new Map<ReferenceAsset, Promise<Result>>();
const TTL = 60_000;
const MAX_STALE = 5 * 60_000;

export async function getReferenceChart(asset: ReferenceAsset): Promise<Result> {
  const cached = cache.get(asset);
  const age = cached ? Date.now() - Date.parse(cached.fetchedAt) : Infinity;
  if (cached && age < TTL) return cached;
  const existing = pending.get(asset);
  if (existing) return existing;
  const request = (async () => {
    const headers: Record<string, string> = { Accept: 'application/json', 'User-Agent': 'PRIMEVEST/1.0' };
    if (process.env.COINGECKO_DEMO_API_KEY) headers['x-cg-demo-api-key'] = process.env.COINGECKO_DEMO_API_KEY;
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${asset}/market_chart?vs_currency=usd&days=1`, { headers, cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Reference chart provider returned ${response.status}`);
    const payload = await response.json() as { prices?: unknown };
    if (!Array.isArray(payload.prices)) throw new Error('Reference chart response is invalid');
    const prices = payload.prices.flatMap((row: unknown) => {
      if (!Array.isArray(row) || typeof row[0] !== 'number' || !Number.isFinite(row[0]) || typeof row[1] !== 'number' || !Number.isFinite(row[1]) || row[1] <= 0) return [];
      return [{ time: Math.floor(row[0] / 1000), price: row[1] }];
    }).sort((a, b) => a.time - b.time).slice(-300);
    if (prices.length < 2) throw new Error('Reference chart returned insufficient prices');
    const result: Result = { asset, currency: 'USD', source: 'CoinGecko', fetchedAt: new Date().toISOString(), stale: Date.now() - prices[prices.length - 1].time * 1000 > 10 * 60_000, prices };
    cache.set(asset, result); return result;
  })().catch((error) => {
    if (cached && Date.now() - Date.parse(cached.fetchedAt) < MAX_STALE) return { ...cached, stale: true };
    throw error;
  }).finally(() => pending.delete(asset));
  pending.set(asset, request);
  return request;
}
