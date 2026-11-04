'use client';

import Link from 'next/link';
import { useMarkets } from '@/lib/use-markets';
import { AssetMark } from '@/components/asset-mark';

type Row = { symbol: string; displayName?: string; assetClass?: string; category?: string; last: number; change24h: number | null; volume24h?: number | null };

const GROUPS: { key: string; label: string; match: (r: Row) => boolean }[] = [
  { key: 'CRYPTO', label: 'Digital assets', match: (r) => (r.category ?? r.assetClass ?? '').toUpperCase().includes('CRYPTO') || (r.category ?? '').toUpperCase().includes('SPOT') || (r.category ?? '').toUpperCase().includes('FUTURES') },
  { key: 'FOREX', label: 'Currencies', match: (r) => (r.category ?? r.assetClass ?? '').toUpperCase().includes('FOREX') },
  { key: 'REST', label: 'Indices, metals & energy', match: () => true },
];

function tileColor(chg: number | null) {
  if (chg == null) return 'rgba(148,163,178,0.10)';
  const mag = Math.min(1, Math.abs(chg) / 2.5);
  const alpha = 0.14 + mag * 0.5;
  return chg >= 0 ? `rgba(16,185,129,${alpha.toFixed(2)})` : `rgba(239,68,68,${alpha.toFixed(2)})`;
}

/** Exchange-style heatmap: every listed instrument, coloured by its 24h move. */
export function MarketHeatmap() {
  const { markets, loading } = useMarkets() as { markets: Row[] | null; loading: boolean };
  const rows = (markets ?? []).filter((r) => typeof r.last === 'number' && r.last > 0);

  return (
    <div className="space-y-5">
      {GROUPS.map((g) => {
        const items = g.key === 'REST'
          ? rows.filter((r) => !GROUPS[0].match(r) && !GROUPS[1].match(r))
          : rows.filter(g.match).filter((r) => g.key === 'CRYPTO' ? true : !GROUPS[0].match(r));
        if (!items.length) return null;
        const sorted = [...items].sort((a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0));
        return (
          <div key={g.key}>
            <p className="label mb-2">{g.label}</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
              {sorted.map((r) => {
                const chg = r.change24h;
                const big = chg != null && Math.abs(chg) >= 1.5;
                return (
                  <Link
                    key={r.symbol}
                    href={`/dashboard/trade?symbol=${encodeURIComponent(r.symbol)}`}
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-lg border border-white/[0.06] p-2.5 transition-transform duration-200 hover:scale-[1.03] ${big ? 'min-h-[92px]' : 'min-h-[76px]'}`}
                    style={{ background: tileColor(chg) }}
                  >
                    <span className="flex items-center gap-1.5">
                      <AssetMark symbol={r.symbol} size={14} />
                      <span className="truncate font-mono text-[11px] font-semibold text-white">{r.symbol}</span>
                    </span>
                    <span className="mt-2 flex items-end justify-between gap-1">
                      <span className="font-mono text-[10.5px] text-white/70">{r.last >= 1000 ? r.last.toLocaleString(undefined, { maximumFractionDigits: 0 }) : r.last}</span>
                      <span className={`font-mono text-[11px] font-bold ${chg == null ? 'text-white/50' : chg >= 0 ? 'text-emerald' : 'text-siren'}`}>
                        {chg == null ? '—' : `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
      {loading && !rows.length && <p className="text-[12px] text-muted">Loading market heatmap…</p>}
      <p className="text-[10.5px] text-muted">Tile colour intensity tracks the size of the 24-hour move. Select a tile to open it in the terminal.</p>
    </div>
  );
}
