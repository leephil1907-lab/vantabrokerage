'use client';

import Link from 'next/link';
import { useMarkets } from '@/lib/use-markets';
import { AssetMark } from '@/components/asset-mark';

type Row = { symbol: string; last: number | null; change24h: number | null };

const price = (n: number) => (n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : n >= 1 ? n.toFixed(2 + (n < 10 ? 2 : 0)) : n.toPrecision(3));

/**
 * Public live ticker tape: every listed instrument with its brand mark,
 * last price and 24h move, in a seamless marquee. Pauses on hover/focus.
 */
export function TickerTape() {
  const { markets } = useMarkets() as { markets: Row[] | null };
  const rows = (markets ?? []).filter((r): r is Row & { last: number } => typeof r.last === 'number' && r.last > 0);
  if (!rows.length) return null;
  const loop = [...rows, ...rows];
  return (
    <div className="relative border-b border-white/[0.07] bg-[#0a0e16]" aria-label="Live market ticker">
      <div className="ticker-marquee overflow-hidden py-2.5">
        <div className="ticker-track flex w-max items-center gap-6 px-4">
          {loop.map((r, i) => (
            <Link key={`${r.symbol}-${i}`} href={`/terminal?symbol=${encodeURIComponent(r.symbol)}`} className="flex shrink-0 items-center gap-2 rounded-md px-1 py-0.5 transition hover:bg-white/[0.06]">
              <AssetMark symbol={r.symbol} size={16} />
              <span className="font-mono text-[11px] font-semibold tracking-tight text-[#eef1f6]">{r.symbol}</span>
              <span className="font-mono text-[11px] text-[#eef1f6]/70">{price(r.last)}</span>
              <span className={`font-mono text-[10.5px] font-bold ${r.change24h == null ? 'text-[#eef1f6]/40' : r.change24h >= 0 ? 'text-emerald' : 'text-siren'}`}>
                {r.change24h == null ? '' : `${r.change24h >= 0 ? '▲' : '▼'} ${Math.abs(r.change24h).toFixed(2)}%`}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
