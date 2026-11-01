'use client';

import { useMemo, useState } from 'react';
import { fmtPct, fmtPrice, priceDp } from '@/lib/format';

export type MarketRow = {
  symbol: string;
  displayName: string;
  category: string;
  assetClass: string;
  baseAsset: string;
  quoteAsset: string;
  pricePrecision: number;
  maxLeverage: number;
  last: number | null;
  bid: number | null;
  ask: number | null;
  change24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  source: string | null;
  fetchedAt: string | null;
  stale: boolean;
};

/** Searchable market list used in the left rail of every terminal. */
export function MarketList({
  markets,
  active,
  onSelect,
  onToggleWatch,
  watching = [],
  showCategory = true,
  dense = false,
  filter,
  categoryTabs = false,
  loading = true,
}: {
  markets: MarketRow[];
  active: string;
  onSelect: (symbol: string) => void;
  onToggleWatch?: (symbol: string) => void;
  watching?: string[];
  showCategory?: boolean;
  dense?: boolean;
  filter?: (m: MarketRow) => boolean;
  categoryTabs?: boolean;
  loading?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'watch'>('all');
  const [category, setCategory] = useState('ALL');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return markets
      .filter((m) => (filter ? filter(m) : true))
      .filter((m) => category === 'ALL' || m.category === category)
      .filter((m) => (tab === 'watch' ? watching.includes(m.symbol) : true))
      .filter((m) => !q || m.symbol.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q));
  }, [markets, query, tab, watching, filter, category]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.07] p-2.5">
        <div className="relative">
          <svg className="absolute left-2.5 top-2.5 text-muted" width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8.5 8.5 11.5 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets"
            className="field-sm pl-8"
          />
        </div>
        {categoryTabs && <div className="mt-2 flex gap-1 overflow-x-auto" aria-label="Filter by asset category">{[{id:'ALL',label:'All'},{id:'FOREX',label:'FX'},{id:'CFD',label:'CFDs'},{id:'SPOT',label:'Spot'},{id:'FUTURES',label:'Futures'}].map(c => <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)} className={`shrink-0 rounded-md px-2 py-1 text-[10px] ${category === c.id ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}>{c.label}</button>)}</div>}
        {onToggleWatch && (
          <div className="mt-2 flex gap-1">
            {(['all', 'watch'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition ${tab === t ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}
              >
                {t === 'all' ? 'All markets' : `Watchlist (${watching.length})`}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin">
        {list.length === 0 && (
          markets.length === 0 && loading ? (
            <div className="space-y-1.5 p-2">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-shimmer h-9 w-full" />)}
              <p className="pt-1 text-center text-[10.5px] text-muted">Loading instruments…</p>
            </div>
          ) : (
            <p className="px-3 py-6 text-center text-[11px] text-muted">{markets.length ? 'No markets match your search.' : 'No configured instruments are available.'}</p>
          )
        )}
        {list.map((m) => {
          const up = (m.change24h ?? 0) >= 0;
          const isActive = m.symbol === active;
          return (
            <div
              key={m.symbol}
              className={`group flex items-center gap-2 border-b border-white/[0.04] px-2.5 transition-colors ${dense ? 'py-1.5' : 'py-2'} ${isActive ? 'bg-lime/[0.07]' : 'hover:bg-white/[0.03]'}`}
            >
              <button type="button" onClick={() => onSelect(m.symbol)} aria-pressed={isActive} aria-label={`Select ${m.symbol}`} className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left">
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className={`truncate text-[12px] font-medium ${isActive ? 'text-lime' : 'text-white'}`}>{m.symbol}</span>
                  {m.stale && <span className="rounded bg-siren/15 px-1 text-[8.5px] font-semibold text-siren">STALE</span>}
                </span>
                {showCategory && <span className="text-[9.5px] uppercase tracking-wide text-muted">{m.category}</span>}
              </span>
              <span className="text-right">
                <span className="block value-mono text-[11.5px] font-medium text-white">{fmtPrice(m.last, priceDp(m.symbol))}</span>
                <span className={`block value-mono text-[10px] ${up ? 'text-emerald' : 'text-danger'}`}>{fmtPct(m.change24h)}</span>
              </span>
              </button>
                {onToggleWatch && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleWatch(m.symbol); }}
                    className={`shrink-0 rounded p-0.5 transition ${watching.includes(m.symbol) ? 'text-lime' : 'text-white/15 hover:text-white/50'}`}
                    aria-label={`${watching.includes(m.symbol) ? 'Remove' : 'Add'} ${m.symbol} ${watching.includes(m.symbol) ? 'from' : 'to'} watchlist`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill={watching.includes(m.symbol) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2">
                      <path d="M6 1.2 7.5 4.3l3.4.5-2.45 2.4.57 3.4L6 8.9l-3.02 1.7.57-3.4L1.1 4.8l3.4-.5z" />
                    </svg>
                  </button>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
