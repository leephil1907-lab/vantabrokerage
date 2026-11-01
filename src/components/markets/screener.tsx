'use client';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Skeleton, apiFetch } from '@/components/ui';
import { ProfileDrawer, type ProfileTarget } from '@/components/markets/profile-drawer';
import { fmtPct, fmtPrice } from '@/lib/format';

type Row = { symbol: string; name: string; description: string; price: number | null; changePct: number | null; volume: number | null; marketCap: number | null; sector: string | null; exchange: string | null; relVolume: number | null; rating: number | null; type: string | null };
type Response = { market: string; preset: string; page: number; total: number; rows: Row[] };

const MARKETS = [
  { id: 'stocks', label: 'US stocks' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'forex', label: 'Forex' },
  { id: 'cfd', label: 'Indices & CFDs' },
] as const;
const PRESETS = [
  { id: 'gainers', label: 'Top gainers' },
  { id: 'losers', label: 'Top losers' },
  { id: 'most_active', label: 'Most active' },
  { id: 'large_cap', label: 'Large cap' },
  { id: 'strong_technicals', label: 'Technically strong' },
  { id: 'weak_technicals', label: 'Technically weak' },
] as const;

function ratingBadge(r: number | null) {
  if (r == null) return null;
  if (r > 0.5) return <Badge tone="green">Strong buy</Badge>;
  if (r > 0.1) return <Badge tone="green">Buy</Badge>;
  if (r > -0.1) return <Badge tone="gray">Neutral</Badge>;
  if (r > -0.5) return <Badge tone="red">Sell</Badge>;
  return <Badge tone="red">Strong sell</Badge>;
}

const compact = (v: number | null) => {
  if (v == null) return '—';
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
};

export function Screener() {
  const [market, setMarket] = useState<(typeof MARKETS)[number]['id']>('stocks');
  const [preset, setPreset] = useState<(typeof PRESETS)[number]['id']>('gainers');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileTarget | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiFetch<Response>(`/api/markets/screener?market=${market}&preset=${preset}&page=${page}`);
      setData(res);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [market, preset, page]);

  useEffect(() => { void load(); const t = setInterval(load, 90_000); return () => clearInterval(t); }, [load]);

  return (
    <section className="panel overflow-hidden" aria-labelledby="screener-title">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <div>
          <h2 id="screener-title" className="text-[15px] font-semibold text-white">Global market screener</h2>
          <p className="text-[11px] text-muted">Scans TradingView&apos;s public scanner — reference data, not PRIMEVEST quotes</p>
        </div>
        <span className="text-[10px] uppercase tracking-[.16em] text-muted">{data ? `${data.total.toLocaleString()} matches` : '…'}</span>
      </div>
      <div className="flex flex-wrap gap-2 px-4 pt-3 sm:px-5">
        {MARKETS.map((m) => (
          <button key={m.id} onClick={() => { setMarket(m.id); setPage(0); }} className={`rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition ${market === m.id ? 'bg-lime text-ink-950' : 'border border-white/10 bg-white/[0.03] text-muted hover:text-white'}`}>{m.label}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 pt-2 sm:px-5">
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => { setPreset(p.id); setPage(0); }} className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition ${preset === p.id ? 'border-lime/50 bg-lime/10 text-lime' : 'border border-white/[0.08] text-muted hover:text-white'}`}>{p.label}</button>
        ))}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[12px]">
          <thead>
            <tr className="border-y border-white/[0.07] text-[10px] uppercase tracking-[.14em] text-muted">
              <th className="px-4 py-2 font-semibold sm:px-5">Symbol</th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 text-right font-semibold">Price</th>
              <th className="px-3 py-2 text-right font-semibold">24h / day</th>
              <th className="px-3 py-2 text-right font-semibold">Volume</th>
              <th className="px-3 py-2 text-right font-semibold">Cap</th>
              <th className="px-3 py-2 font-semibold">Sector</th>
              <th className="px-4 py-2 text-right font-semibold sm:px-5">Technicals</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data ? <tr><td colSpan={8} className="px-5 py-6"><Skeleton className="h-24" /></td></tr>
              : error ? <tr><td colSpan={8} className="px-5 py-6 text-center text-[12px] text-danger">{error}</td></tr>
              : (data?.rows ?? []).map((r) => (
                <tr key={r.symbol} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-2.5 sm:px-5">
                    <a href={`https://www.tradingview.com/symbols/${encodeURIComponent(r.symbol)}/`} target="_blank" rel="noopener noreferrer" className="font-mono text-[11.5px] font-semibold text-lime hover:underline">{r.symbol}</a>
                    <span className="block text-[9.5px] text-muted">{r.exchange ?? ''}</span>
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2.5 text-white" title={r.description}>
                    {market === 'stocks' ? (
                      <button
                        type="button"
                        onClick={() => setProfile({ symbol: r.symbol, ticker: r.symbol.split(':').pop() ?? r.symbol })}
                        className="max-w-full truncate text-left hover:text-lime hover:underline"
                        title={`View ${r.name} company profile`}
                      >{r.name} <span className="text-[9.5px] text-muted">ⓘ</span></button>
                    ) : r.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-white">{r.price != null ? fmtPrice(r.price, r.price < 1 ? 5 : 2) : '—'}</td>
                  <td className={`whitespace-nowrap px-3 py-2.5 text-right font-mono font-semibold ${(r.changePct ?? 0) >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtPct(r.changePct)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-muted">{compact(r.volume)}{r.relVolume != null && r.relVolume > 2 ? <span className="ml-1 text-lime" title="Relative volume vs 10-day average">×{r.relVolume.toFixed(1)}</span> : null}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-muted">{compact(r.marketCap)}</td>
                  <td className="max-w-[130px] truncate px-3 py-2.5 text-muted">{r.sector ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right sm:px-5">{ratingBadge(r.rating)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="btn-ghost px-3 py-1.5 text-[11px] disabled:opacity-40">← Previous</button>
        <span className="text-[10.5px] text-muted">Page {page + 1}</span>
        <button disabled={!data || (page + 1) * 25 >= data.total} onClick={() => setPage((p) => p + 1)} className="btn-ghost px-3 py-1.5 text-[11px] disabled:opacity-40">Next →</button>
      </div>
      <ProfileDrawer target={profile} onClose={() => setProfile(null)} />
    </section>
  );
}
