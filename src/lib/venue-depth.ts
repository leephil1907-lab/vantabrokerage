import 'server-only';

/** Public Kraken level-2 depth. Never used for PRIMEVEST order placement or fills. */
const PAIRS = {
  'BTC/USD': 'XBTUSD', 'BTC/USDT': 'XBTUSDT',
  'ETH/USD': 'ETHUSD', 'ETH/USDT': 'ETHUSDT',
  'SOL/USD': 'SOLUSD', 'SOL/USDT': 'SOLUSDT',
} as const;
export type VenueSymbol = keyof typeof PAIRS;
type Level = { price: number; quantity: number; time: number };
type Book = { symbol: VenueSymbol; source: 'Kraken'; fetchedAt: string; stale: boolean; bids: Level[]; asks: Level[] };
const cache = new Map<VenueSymbol, Book>();
const pending = new Map<VenueSymbol, Promise<Book>>();

export function isVenueSymbol(value: string): value is VenueSymbol { return Object.hasOwn(PAIRS, value); }
function levels(raw: unknown): Level[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((x): Level[] => {
    if (!Array.isArray(x) || x.length < 3) return [];
    const price = Number(x[0]), quantity = Number(x[1]), time = Number(x[2]);
    return Number.isFinite(price) && price > 0 && Number.isFinite(quantity) && quantity > 0 && Number.isFinite(time) && time > 0 ? [{ price, quantity, time }] : [];
  }).slice(0, 10);
}
export async function getVenueDepth(symbol: VenueSymbol): Promise<Book> {
  const previous = cache.get(symbol);
  if (previous && Date.now() - Date.parse(previous.fetchedAt) < 5000) return previous;
  const active = pending.get(symbol);
  if (active) return active;
  const task = (async () => {
    const res = await fetch(`https://api.kraken.com/0/public/Depth?pair=${PAIRS[symbol]}&count=10`, { cache: 'no-store', signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json', 'User-Agent': 'PRIMEVEST/1.0' } });
    if (!res.ok) throw new Error('Venue data unavailable');
    const body = await res.json() as { error?: string[]; result?: Record<string, { bids: unknown; asks: unknown }> };
    if (body.error?.length || !body.result) throw new Error('Venue data unavailable');
    const book = Object.values(body.result)[0];
    const bids = levels(book?.bids).sort((a, b) => b.price - a.price);
    const asks = levels(book?.asks).sort((a, b) => a.price - b.price);
    if (!bids.length || !asks.length || bids[0].price > asks[0].price) throw new Error('Invalid venue depth');
    const result: Book = { symbol, source: 'Kraken', fetchedAt: new Date().toISOString(), stale: false, bids, asks };
    cache.set(symbol, result); return result;
  })().catch(err => {
    if (previous && Date.now() - Date.parse(previous.fetchedAt) < 30_000) return { ...previous, stale: true };
    throw err;
  }).finally(() => pending.delete(symbol));
  pending.set(symbol, task); return task;
}
