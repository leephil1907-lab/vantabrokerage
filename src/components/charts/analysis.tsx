'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatedNumber } from '@/components/motion/primitives';
import { fmtPrice, priceDp } from '@/lib/format';

/**
 * Right-hand analysis panel: live depth, recent prints and session statistics,
 * all derived from the server quote stream. Depth is a labelled model around the
 * real top of book (no exchange-native full book is available from the current
 * providers), and the label says so.
 */
export function DepthPanel({ symbol, quote }: { symbol: string; quote: { bid: number; ask: number; source?: string; volume24h?: number | null; high24h?: number | null; low24h?: number | null; last?: number } | null }) {
  if (!quote || !quote.bid || !quote.ask) {
    return <div className="p-3 text-[11px] text-muted">Waiting for a two-sided quote…</div>;
  }
  const dp = Math.min(6, Math.max(2, priceDp(symbol)));
  const mid = (quote.bid + quote.ask) / 2;
  const tick = Math.max(Math.abs(quote.ask - quote.bid) / 2, mid * 1e-5);
  const rows = 7;
  // Deterministic shape from the spread so the ladder never flickers randomly.
  const shape = (i: number) => 0.25 + Math.abs(Math.sin((i + 1) * (symbol.length + 1))) * 0.75;
  const bids = Array.from({ length: rows }, (_, i) => ({ price: quote.bid - tick * (i + 1), size: shape(i) }));
  const asks = Array.from({ length: rows }, (_, i) => ({ price: quote.ask + tick * (i + 1), size: shape(i + 3) }));
  const maxSize = Math.max(...bids.map((b) => b.size), ...asks.map((a) => a.size));

  return (
    <div className="p-2.5">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1 pb-1 text-[9.5px] uppercase tracking-[0.12em] text-muted">
        <span>Price</span><span className="text-right">Size</span><span className="text-right">Total</span>
      </div>
      {asks.slice().reverse().map((a, i) => (
        <Row key={`a${i}`} price={fmtPrice(a.price, dp)} size={a.size} pct={(a.size / maxSize) * 100} tone="down" />
      ))}
      <div className="my-1 flex items-center justify-between rounded-md border border-white/[0.07] bg-ink-950/60 px-2 py-1">
        <span className="text-[10px] text-muted">spread</span>
        <span className="value-mono text-[10.5px] text-white">{fmtPrice(quote.ask - quote.bid, dp)}</span>
      </div>
      {bids.map((b, i) => (
        <Row key={`b${i}`} price={fmtPrice(b.price, dp)} size={b.size} pct={(b.size / maxSize) * 100} tone="up" />
      ))}
      <p className="mt-2 px-1 text-[9.5px] leading-relaxed text-muted">
        Depth model around the live top of book ({quote.source ?? 'provider'}). Not exchange-native ladder depth.
      </p>
    </div>
  );
}

function Row({ price, size, pct, tone }: { price: string; size: number; pct: number; tone: 'up' | 'down' }) {
  return (
    <div className="relative grid grid-cols-[1fr_1fr_auto] gap-2 px-1 py-[3px] text-[10.5px]">
      <span className="absolute inset-y-0 right-0 rounded-sm" style={{ width: `${pct}%`, background: tone === 'up' ? 'rgba(46,230,168,0.10)' : 'rgba(255,91,110,0.10)' }} />
      <span className={`value-mono relative ${tone === 'up' ? 'text-emerald' : 'text-danger'}`}>{price}</span>
      <span className="value-mono relative text-right text-white/80">{size.toFixed(3)}</span>
      <span className="value-mono relative text-right text-muted">{(size * pct / 10).toFixed(2)}</span>
    </div>
  );
}

export function TradesTape({ symbol }: { symbol: string }) {
  const [prints, setPrints] = useState<{ price: number; qty: number; side: 'BUY' | 'SELL'; time: number }[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    setPrints([]);
    seq.current = 0;
    let cancelled = false;
    const pull = async () => {
      try {
        const q = await fetch(`/api/markets/${encodeURIComponent(symbol)}/quote`, { cache: 'no-store' }).then((r) => r.json());
        if (cancelled || !q?.last) return;
        // Prints are derived from the live quote + timestamp; the tape is labelled "quote prints".
        const side: 'BUY' | 'SELL' = (q.last >= (q.ask ?? q.last)) ? 'BUY' : 'SELL';
        const qty = 0.01 + ((Date.now() / 1000 + seq.current) % 7) / 100;
        seq.current += 1;
        setPrints((prev) => [{ price: q.last, qty, side, time: Date.now() }, ...prev].slice(0, 16));
      } catch { /* feed errors are shown by the chart footer */ }
    };
    pull();
    const id = setInterval(pull, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [symbol]);

  const dp = Math.min(6, Math.max(2, priceDp(symbol)));
  if (!prints.length) return <div className="p-3 text-[11px] text-muted">No prints yet — waiting for the feed.</div>;
  return (
    <div className="p-2">
      <div className="grid grid-cols-3 px-1 pb-1 text-[9.5px] uppercase tracking-[0.12em] text-muted">
        <span>Price</span><span className="text-right">Size</span><span className="text-right">Time</span>
      </div>
      {prints.map((p, i) => (
        <div key={`${p.time}-${i}`} className="grid grid-cols-3 px-1 py-[2.5px] text-[10.5px]">
          <span className={`value-mono ${p.side === 'BUY' ? 'text-emerald' : 'text-danger'}`}>{fmtPrice(p.price, dp)}</span>
          <span className="value-mono text-right text-white/80">{p.qty.toFixed(3)}</span>
          <span className="value-mono text-right text-muted">{new Date(p.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      ))}
      <p className="mt-1.5 px-1 text-[9.5px] leading-relaxed text-muted">Quote prints sampled from the live feed, not exchange trade history.</p>
    </div>
  );
}

export function SessionStats({ symbol, quote }: { symbol: string; quote: { last?: number; high24h?: number | null; low24h?: number | null; volume24h?: number | null } | null }) {
  if (!quote?.last) return null;
  const dp = Math.min(6, Math.max(2, priceDp(symbol)));
  const range = quote.high24h != null && quote.low24h != null ? quote.high24h - quote.low24h : null;
  const pos = range && range > 0 && quote.low24h != null ? ((quote.last - quote.low24h) / range) * 100 : null;
  return (
    <div className="space-y-2 p-2.5">
      <Stat label="Last" value={<AnimatedNumber value={quote.last} decimals={dp} className="text-[13px] font-semibold text-white" />} />
      <Stat label="24h high" value={<span className="value-mono text-[12px] text-white">{quote.high24h != null ? fmtPrice(quote.high24h, dp) : '—'}</span>} />
      <Stat label="24h low" value={<span className="value-mono text-[12px] text-white">{quote.low24h != null ? fmtPrice(quote.low24h, dp) : '—'}</span>} />
      <Stat label="24h volume" value={<span className="value-mono text-[12px] text-white">{quote.volume24h != null ? quote.volume24h.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}</span>} />
      {pos != null && (
        <div className="pt-1">
          <div className="relative h-1.5 rounded-full bg-white/[0.07]">
            <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-ink-900 bg-lime" style={{ left: `calc(${Math.max(0, Math.min(100, pos))}% - 5px)` }} />
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-muted"><span>session low</span><span>session high</span></div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10.5px] text-muted">{label}</span>
      {value}
    </div>
  );
}
