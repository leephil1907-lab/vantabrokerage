'use client';
import { useEffect, useMemo, useState } from 'react';
import { Skeleton, apiFetch } from '@/components/ui';
import { relTime } from '@/lib/format';

type NewsItem = { id: string; headline: string; summary: string; source: string; url: string; publishedAt: string };
type NewsResponse = { provider: 'finnhub' | 'none'; items: NewsItem[]; message?: string };

const CRYPTO_BASES = new Set(['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'LTC', 'TRX', 'USDT', 'USDC']);
const FIAT_BASES = new Set(['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD']);

/** Maps a PRIMEVEST symbol (BTC/USDT, EUR/USD, NAS100, XAU/USD, BTC/USDT-PERP…) to a Finnhub news category. */
export function newsCategoryFor(symbol: string): 'crypto' | 'forex' | 'general' {
  const s = symbol.toUpperCase();
  if (s.includes('PERP')) return 'crypto';
  const base = s.split(/[/\-\s]/)[0] ?? '';
  if (CRYPTO_BASES.has(base)) return 'crypto';
  if (FIAT_BASES.has(base)) return 'forex';
  return 'general';
}

const LABEL: Record<string, string> = { crypto: 'Crypto wire', forex: 'FX wire', general: 'Market wire' };

/** Compact news box for the terminal right column — category follows the selected symbol. */
export function SymbolNews({ symbol }: { symbol: string }) {
  const category = useMemo(() => newsCategoryFor(symbol), [symbol]);
  const [data, setData] = useState<NewsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    const load = async () => {
      try {
        const res = await apiFetch<NewsResponse>(`/api/news?category=${category}`);
        if (!cancelled) setData(res);
      } catch { /* keep the last good render; the panel is auxiliary */ }
    };
    void load();
    const t = setInterval(load, 5 * 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [category]);

  return (
    <div className="mt-3 rounded-xl border border-white/[0.06] bg-ink-950/40">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-2.5 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">News · {symbol}</p>
        <span className="rounded-full border border-lime/30 bg-lime/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-lime">{LABEL[category]}</span>
      </div>
      <div className="px-2.5 py-2">
        {!data && <Skeleton className="h-20" />}
        {data?.provider === 'none' && (
          <p className="py-1 text-[10.5px] leading-relaxed text-muted">{data.message ?? 'Editorial news is not configured.'}</p>
        )}
        {data?.provider === 'finnhub' && (
          <ul className="space-y-2">
            {data.items.slice(0, 5).map((n) => (
              <li key={n.id} className="border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="line-clamp-2 text-[11.5px] font-medium leading-snug text-white hover:text-lime">{n.headline}</a>
                <p className="mt-0.5 text-[9.5px] text-muted">{n.source} · {relTime(n.publishedAt)}</p>
              </li>
            ))}
            {!data.items.length && <p className="py-1 text-[10.5px] text-muted">No headlines in this feed right now.</p>}
          </ul>
        )}
      </div>
    </div>
  );
}
