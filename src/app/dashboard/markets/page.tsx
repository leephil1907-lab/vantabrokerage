'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge, Tabs, EmptyState } from '@/components/ui';
import { AssetMark } from '@/components/asset-mark';
import { CryptoDiscovery } from '@/components/crypto-discovery';
import { PriceAlerts } from '@/components/markets/price-alerts';
import { useMarkets } from '@/lib/use-markets';
import { fmtPct, fmtPrice, fmtQty, priceDp, relTime } from '@/lib/format';

const TABS = [
  { id: 'ALL', label: 'All markets' },
  { id: 'FOREX', label: 'Forex' },
  { id: 'CFD', label: 'Indices & commodities' },
  { id: 'SPOT', label: 'Crypto spot' },
  { id: 'FUTURES', label: 'Futures' },
  { id: 'BINARY', label: 'Short-expiry' },
] as const;

export default function MarketsPage() {
  const { markets, error, loading } = useMarkets();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('ALL');
  const [query, setQuery] = useState('');
  const [watched, setWatched] = useState<string[]>([]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return markets
      .filter((m) => (tab === 'ALL' ? true : m.category === tab))
      .filter((m) => !q || m.symbol.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q));
  }, [markets, tab, query]);

  const toggle = async (symbol: string) => {
    const res = await fetch('/api/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol, action: 'toggle' }) });
    const body = await res.json();
    if (res.ok) setWatched((p) => (body.watching ? [...p, symbol] : p.filter((s) => s !== symbol)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Markets</h1>
          <p className="mt-0.5 text-[12px] text-muted">Every instrument available on the platform, with provider attribution and freshness.</p>
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search symbol or name" className="field-sm w-full sm:w-64" />
      </div>

      {error && <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-[12px] text-danger">Market feed error: {error}</div>}

      <div className="panel overflow-hidden">
        <Tabs tabs={TABS.map((t) => ({ id: t.id, label: t.label }))} value={tab} onChange={(v) => setTab(v as never)} />
        {loading && !markets.length ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-9 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No markets found" body="Try a different search or category." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px]">
              <thead>
                <tr>
                  <th className="th">Instrument</th><th className="th">Type</th><th className="th text-right">Last</th><th className="th text-right">Bid</th><th className="th text-right">Ask</th>
                  <th className="th text-right">24h</th><th className="th text-right">24h volume</th><th className="th">Source</th><th className="th text-right">Updated</th><th className="th">Trade</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const up = (m.change24h ?? 0) >= 0;
                  const tradingHref = m.category === 'SPOT' ? '/dashboard/crypto' : m.category === 'FUTURES' ? '/dashboard/futures' : m.category === 'BINARY' ? '/dashboard/short-expiry' : '/dashboard/forex';
                  return (
                    <tr key={m.symbol} className="table-row">
                      <td className="td">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggle(m.symbol)} className="text-white/20 transition hover:text-lime" aria-label="Watchlist">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M6 1.2 7.5 4.3l3.4.5-2.45 2.4.57 3.4L6 8.9l-3.02 1.7.57-3.4L1.1 4.8l3.4-.5z" /></svg>
                          </button>
                          <AssetMark symbol={m.symbol} size={24} />
                          <div>
                            <p className="font-medium text-white">{m.symbol}</p>
                            <p className="text-[10px] text-muted">{m.displayName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td"><Badge tone={m.category === 'SPOT' ? 'lime' : m.category === 'FUTURES' ? 'blue' : m.category === 'BINARY' ? 'amber' : 'gray'}>{m.category}</Badge></td>
                      <td className="td text-right value-mono font-medium">{fmtPrice(m.last, priceDp(m.symbol))}</td>
                      <td className="td text-right value-mono text-muted">{fmtPrice(m.bid, priceDp(m.symbol))}</td>
                      <td className="td text-right value-mono text-muted">{fmtPrice(m.ask, priceDp(m.symbol))}</td>
                      <td className={`td text-right value-mono ${up ? 'text-emerald' : 'text-danger'}`}>{fmtPct(m.change24h)}</td>
                      <td className="td text-right value-mono text-muted">{m.volume24h ? fmtQty(m.volume24h, 0) : '—'}</td>
                      <td className="td text-[11px] uppercase tracking-wide text-muted">{m.source ?? (m.stale ? 'stale' : '—')}</td>
                      <td className="td text-right text-[11px] text-muted">{relTime(m.fetchedAt)}</td>
                      <td className="td text-right"><Link href={`${tradingHref}?symbol=${encodeURIComponent(m.symbol)}`} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] font-medium text-lime hover:border-lime/40">Open</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="pt-5"><PriceAlerts symbols={markets.map((m) => m.symbol)} /></div>
      <div className="pt-5"><CryptoDiscovery compactLayout /></div>
    </div>
  );
}
