'use client';

import { useMarkets } from '@/lib/use-markets';
import { AssetMark } from '@/components/asset-mark';

type Row = { symbol: string; last: number | null; change24h: number | null; volume24h?: number | null };

/** Auto-generated brief composed from live provider quotes — always data-driven. */
export function MarketBrief() {
  const { markets } = useMarkets() as { markets: Row[] | null };
  const rows = (markets ?? []).filter((r) => typeof r.last === 'number' && r.change24h != null);
  if (!rows.length) return <p className="text-[11.5px] text-muted">The market brief compiles as soon as live quotes arrive.</p>;
  const gainers = [...rows].sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0)).slice(0, 3);
  const laggards = [...rows].sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0)).slice(0, 3);
  const Block = ({ title, items, tone }: { title: string; items: Row[]; tone: 'up' | 'down' }) => (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((r) => (
          <li key={`${title}-${r.symbol}`} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <AssetMark symbol={r.symbol} size={16} />
              <span className="truncate font-mono text-[11.5px] font-semibold text-white">{r.symbol}</span>
            </span>
            <span className={`font-mono text-[11.5px] font-bold ${tone === 'up' ? 'text-emerald' : 'text-siren'}`}>
              {(r.change24h ?? 0) >= 0 ? '+' : ''}{(r.change24h ?? 0).toFixed(2)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Block title="Leading today" items={gainers} tone="up" />
      <Block title="Lagging today" items={laggards} tone="down" />
      <p className="sm:col-span-2 text-[10.5px] leading-relaxed text-muted">Auto-generated from live provider quotes and refreshed continuously while markets are open.</p>
    </div>
  );
}
