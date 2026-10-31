'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import type { CryptoDiscoveryAsset, CryptoDiscoveryResponse } from '@/lib/coingecko';
import { fmtPct, relTime } from '@/lib/format';

type Sort = 'rank' | 'gainers' | 'losers';
const PAGE_SIZE = 25;

function price(value: number | null) {
  if (value === null) return '—';
  if (value >= 1) return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Significant digits keep very small token prices from rounding to a false zero.
  return '$' + value.toLocaleString('en-US', { maximumSignificantDigits: 6 });
}
function compact(value: number | null) {
  if (value === null) return '—';
  return '$' + Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}
function CoinIcon({ asset }: { asset: CryptoDiscoveryAsset }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [asset.image]);
  return asset.image && !failed ? (
    // CoinGecko-hosted original asset icons; the backend restricts the image host.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={asset.image} onError={() => setFailed(true)} loading="lazy" alt="" width={30} height={30} className="h-[30px] w-[30px] shrink-0 rounded-full object-contain" />
  ) : <span aria-hidden="true" className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[10px] font-semibold text-white/70">{asset.symbol.slice(0, 2)}</span>;
}

export function CryptoDiscovery({ compactLayout = false }: { compactLayout?: boolean }) {
  const [data, setData] = useState<CryptoDiscoveryResponse | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('rank');
  const [page, setPage] = useState(0);
  const [clock, setClock] = useState(0);
  const reduce = useReducedMotion();

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/markets/crypto-discovery', { cache: 'no-store', signal });
      if (!res.ok) throw new Error('feed unavailable');
      const body = await res.json() as CryptoDiscoveryResponse;
      setData(body); setError(false); setClock(Date.now());
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(true); setClock(Date.now());
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const interval = window.setInterval(() => { if (!document.hidden) void load(controller.signal); }, 60_000);
    const tick = window.setInterval(() => setClock(Date.now()), 30_000);
    const onVisibility = () => { if (!document.hidden) void load(controller.signal); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { controller.abort(); clearInterval(interval); clearInterval(tick); document.removeEventListener('visibilitychange', onVisibility); };
  }, [load]);
  useEffect(() => setPage(0), [query, sort]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = (data?.assets ?? []).filter((a) => !q || `${a.name} ${a.symbol} ${a.id}`.toLowerCase().includes(q));
    if (sort !== 'rank') filtered.sort((a, b) => {
      if (a.change24h === null) return 1;
      if (b.change24h === null) return -1;
      return sort === 'gainers' ? b.change24h - a.change24h : a.change24h - b.change24h;
    });
    return filtered;
  }, [data, query, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const actualPage = Math.min(page, pages - 1);
  const delayed = error || !!data?.stale || (!!data && clock > 0 && clock - Date.parse(data.fetchedAt) > 120_000);

  return (
    <section aria-labelledby="crypto-discovery-heading" className={compactLayout ? '' : 'shell py-16 sm:py-20'}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Digital assets · market overview</p>
          <h2 id="crypto-discovery-heading" className="display mt-2 text-[26px] sm:text-[32px]">Explore crypto markets</h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">Discover USD reference prices and real asset icons from CoinGecko. Not every listed asset is available for paper trading.</p>
        </div>
        <div aria-live="polite" className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] ${delayed ? 'border-siren/25 text-siren' : 'border-white/10 text-muted'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${delayed ? 'bg-siren' : 'bg-emerald'}`} />
          {!data ? (error ? 'Feed unavailable' : 'Connecting to market data') : delayed ? `Delayed · fetched ${relTime(data.fetchedAt)}` : `CoinGecko · fetched ${relTime(data.fetchedAt)}`}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-850/75 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-4 sm:p-5">
          <div className="flex items-center gap-2"><span className="text-[13px] font-semibold text-white">Market directory</span><span className="chip">{data ? `${rows.length} assets` : '—'}</span></div>
          <div className="flex w-full gap-2 sm:w-auto">
            <label className="min-w-0 flex-1 sm:w-56"><span className="sr-only">Search crypto assets</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assets" className="field-sm" /></label>
            <label><span className="sr-only">Sort crypto assets</span><select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field-sm h-full w-auto"><option value="rank">Market rank</option><option value="gainers">Top gainers</option><option value="losers">Top losers</option></select></label>
          </div>
        </div>
        {!data && !error ? <div className="space-y-2 p-5" aria-label="Loading market data">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-10 w-full" />)}</div> : !data ? (
          <div className="p-8 text-center"><p className="text-sm text-white">Market data is temporarily unavailable.</p><button onClick={() => void load()} className="btn-ghost mt-4 text-xs">Try again</button></div>
        ) : rows.length === 0 ? <div className="p-8 text-center text-sm text-muted">No assets match your search.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/[0.025]"><tr><th className="th hidden sm:table-cell">#</th><th className="th">Asset</th><th className="th text-right">Price (USD)</th><th className="th text-right">24h</th><th className="th hidden text-right md:table-cell">Market cap</th><th className="th hidden text-right lg:table-cell">24h volume</th><th className="th hidden text-right xl:table-cell">Updated</th></tr></thead>
              <tbody>{rows.slice(actualPage * PAGE_SIZE, (actualPage + 1) * PAGE_SIZE).map((asset, i) => {
                const rowStale = !asset.updatedAt || (clock > 0 && clock - Date.parse(asset.updatedAt) > 300_000);
                return <motion.tr key={asset.id} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: Math.min(i * 0.012, 0.18) }} className="table-row">
                  <td className="td hidden text-muted sm:table-cell">{asset.rank ?? '—'}</td>
                  <td className="td"><div className="flex min-w-0 items-center gap-3"><CoinIcon asset={asset}/><div className="min-w-0"><span className="block max-w-[125px] truncate font-semibold text-white sm:max-w-[220px]">{asset.name}</span><span className="text-[10px] uppercase tracking-wider text-muted">{asset.symbol}{rowStale && <span className="ml-2 text-siren">Delayed</span>}</span></div></div></td>
                  <td className="td whitespace-nowrap text-right value-mono font-medium">{price(asset.priceUsd)}</td>
                  <td className={`td whitespace-nowrap text-right value-mono ${asset.change24h === null ? 'text-muted' : asset.change24h >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtPct(asset.change24h)}</td>
                  <td className="td hidden whitespace-nowrap text-right value-mono text-muted md:table-cell">{compact(asset.marketCap)}</td>
                  <td className="td hidden whitespace-nowrap text-right value-mono text-muted lg:table-cell">{compact(asset.volume24h)}</td>
                  <td className={`td hidden whitespace-nowrap text-right text-[11px] xl:table-cell ${rowStale ? 'text-siren' : 'text-muted'}`}>{rowStale ? 'Delayed · ' : ''}{relTime(asset.updatedAt)}</td>
                </motion.tr>;
              })}</tbody>
            </table>
          </div>
        )}
        {data && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3 text-[11px] text-muted sm:px-5"><span>CoinGecko reference data · refreshed at most once per minute · {delayed ? 'Feed delayed' : 'Individual prices may be delayed'}</span><div className="flex items-center gap-2"><button disabled={actualPage === 0} onClick={() => setPage(actualPage - 1)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-white/80 disabled:opacity-30">Previous</button><span>{actualPage + 1} / {pages}</span><button disabled={actualPage >= pages - 1} onClick={() => setPage(actualPage + 1)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-white/80 disabled:opacity-30">Next</button></div></div>}
      </div>
    </section>
  );
}

/** Compact home preview of the same read-only CoinGecko directory. */
export function CryptoPreview() {
  const [data, setData] = useState<CryptoDiscoveryResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [clock, setClock] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch('/api/markets/crypto-discovery', { cache: 'no-store', signal: controller.signal });
        if (!res.ok) throw new Error('unavailable');
        setData(await res.json()); setFailed(false); setClock(Date.now());
      } catch (e) { if (!(e instanceof Error && e.name === 'AbortError')) setFailed(true); }
    };
    void load();
    const timer = window.setInterval(() => { setClock(Date.now()); if (!document.hidden) void load(); }, 60_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, []);
  const delayed = failed || data?.stale || (!!data && clock - Date.parse(data.fetchedAt) > 120_000);
  return <section className="shell py-14 sm:py-16">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Digital assets</p><h2 className="display mt-2 text-[26px] sm:text-[30px]">Crypto, in focus</h2><p className="mt-2 text-[13px] text-muted">USD reference prices and asset icons powered by CoinGecko.</p></div><Link href="/markets#crypto-discovery-heading" className="text-[13px] font-medium text-lime hover:underline">Explore all assets →</Link></div>
    {data ? <><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{data.assets.slice(0, 4).map((asset) => <div key={asset.id} className="rounded-2xl border border-white/[0.07] bg-ink-850/70 p-4 transition-colors duration-300 hover:border-lime/20"><div className="flex items-center gap-2.5"><CoinIcon asset={asset}/><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-white">{asset.name}</p><p className="text-[10px] uppercase tracking-wider text-muted">{asset.symbol}</p></div></div><p className="value-mono mt-4 text-[17px] font-semibold text-white">{price(asset.priceUsd)}</p><p className={`value-mono mt-1 text-[11px] ${asset.change24h === null ? 'text-muted' : asset.change24h >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtPct(asset.change24h)} <span className="font-sans text-muted"> / 24h</span></p>{(!asset.updatedAt || (clock > 0 && clock - Date.parse(asset.updatedAt) > 300_000)) && <p className="mt-1 text-[10px] text-siren">Price delayed</p>}</div>)}</div><p className="mt-3 text-[10.5px] text-muted">{delayed ? 'Delayed · ' : ''}CoinGecko reference data · fetched {relTime(data.fetchedAt)} · not all assets are available to trade.</p></> : <p className="rounded-xl border border-white/10 p-4 text-[12px] text-muted">{failed ? 'Crypto data is temporarily unavailable.' : 'Loading crypto market data…'}</p>}
  </section>;
}
