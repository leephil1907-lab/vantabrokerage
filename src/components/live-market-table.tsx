'use client';

import Link from 'next/link';
import { Badge } from './ui';
import { useMarkets } from '@/lib/use-markets';
import { AssetMark } from './asset-mark';
import { fmtPct, fmtPrice, priceDp, relTime } from '@/lib/format';

/** Live market table for public pages — real provider data, no placeholders. */
export function LiveMarketTable({ category, limit = 30 }: { category?: string; limit?: number }) {
  const { markets, error, loading } = useMarkets(category);
  if (error) return <div className="panel p-5 text-[12px] text-danger">Live market feed unavailable: {error}</div>;
  if (loading && !markets.length) return <div className="panel space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-8 w-full" />)}</div>;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
      <table className="w-full">
        <thead className="bg-white/[0.02]">
          <tr><th className="th">Instrument</th><th className="th hidden sm:table-cell">Type</th><th className="th text-right">Last</th><th className="th hidden text-right sm:table-cell">Bid</th><th className="th hidden text-right sm:table-cell">Ask</th><th className="th text-right">24h</th><th className="th hidden text-right md:table-cell">Source</th></tr>
        </thead>
        <tbody>
          {markets.slice(0, limit).map((m) => {
            const up = (m.change24h ?? 0) >= 0;
            const dp = (m as { pricePrecision?: number }).pricePrecision ?? priceDp(m.symbol);
            return (
              <tr key={m.symbol} className="table-row">
                <td className="td">
                  <span className="flex items-center gap-2">
                    <AssetMark symbol={m.symbol} size={20} />
                    <span>
                      <span className="block font-medium text-white">{m.symbol}</span>
                      <span className="hidden text-[10px] font-normal text-muted sm:block">{m.displayName}</span>
                    </span>
                  </span>
                </td>
                <td className="td hidden sm:table-cell"><Badge tone="gray">{m.category}</Badge></td>
                <td className="td text-right value-mono">{fmtPrice(m.last, dp)}</td>
                <td className="td hidden text-right value-mono text-muted sm:table-cell">{fmtPrice(m.bid, dp)}</td>
                <td className="td hidden text-right value-mono text-muted sm:table-cell">{fmtPrice(m.ask, dp)}</td>
                <td className={`td text-right value-mono ${up ? 'text-emerald' : 'text-danger'}`}>{fmtPct(m.change24h)}</td>
                <td className="td hidden text-right text-[10.5px] uppercase tracking-wide text-muted md:table-cell">{m.source ?? (m.stale ? 'stale' : '—')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-2.5 text-[10.5px] text-muted">
        <span>{markets.length} instruments · quotes refreshed every 15s · server-side provider fetch</span>
        <Link href="/register" className="text-lime hover:underline">Trade these markets →</Link>
      </div>
    </div>
  );
}
