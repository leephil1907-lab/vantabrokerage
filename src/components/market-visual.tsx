'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fmtPct, fmtPrice, priceDp } from '@/lib/format';



/** Animated depth-based chart used on the marketing site. Draws only real series data. */
export function MarketSparkline({ series, up }: { series: number[]; up: boolean }) {
  const path = useMemo(() => {
    if (series.length < 2) return '';
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    return series
      .map((v, i) => {
        const x = (i / (series.length - 1)) * 100;
        const y = 34 - ((v - min) / range) * 28;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }, [series]);
  const fill = `${path} L100,34 L0,34 Z`;
  const id = up ? 'sparkUp' : 'sparkDown';
  return (
    <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="h-9 w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? '#2ee6a8' : '#ff5b6e'} stopOpacity="0.28" />
          <stop offset="100%" stopColor={up ? '#2ee6a8' : '#ff5b6e'} stopOpacity="0" />
        </linearGradient>
      </defs>
      {path && <path d={fill} fill={`url(#${id})`} />}
      {path && <path d={path} fill="none" stroke={up ? '#2ee6a8' : '#ff5b6e'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

/** Live market ticker tape — values are fetched from /api/markets. */
/** Hero chart: real candles pulled from the terminal API, with a simulated-cursor reveal. */
export function HeroChart({ symbol = 'BTC/USDT' }: { symbol?: string }) {
  const [candles, setCandles] = useState<{ time: number; open: number; high: number; low: number; close: number }[]>([]);
  const [quote, setQuote] = useState<{ last: number; change24h?: number; source: string; fetchedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [cRes, qRes] = await Promise.all([
          fetch(`/api/markets/${encodeURIComponent(symbol)}/candles?interval=5m&limit=90`).then((r) => r.json()),
          fetch(`/api/markets/${encodeURIComponent(symbol)}/quote`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (cRes?.candles?.length) { setCandles(cRes.candles); setReveal(0); }
        if (qRes?.last) setQuote(qRes);
        setError(null);
      } catch {
        if (!cancelled) setError('Live market feed unavailable. Charts will resume when the provider reconnects.');
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [symbol]);

  useEffect(() => {
    if (!candles.length) return;
    let i = 0;
    const step = () => {
      i += 1;
      setReveal(Math.min(i / 22, 1));
      if (i < 22) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [candles]);

  const view = candles.slice(0, Math.max(2, Math.ceil(candles.length * reveal)));
  const min = view.length ? Math.min(...view.map((c) => c.low)) : 0;
  const max = view.length ? Math.max(...view.map((c) => c.high)) : 1;
  const range = max - min || 1;
  const w = 620, h = 240, pad = 6;
  const bw = view.length ? (w - pad * 2) / view.length : 0;
  const y = (v: number) => pad + (1 - (v - min) / range) * (h - pad * 2);

  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime/15 text-[10px] font-bold text-lime">{symbol.split('/')[0].slice(0, 3)}</span>
            <div>
              <p className="text-[13px] font-semibold text-white">{symbol}</p>
              <p className="text-[10px] text-muted">Live · {quote?.source ?? 'connecting'}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="value-mono text-lg font-semibold text-white">{quote ? fmtPrice(quote.last, priceDp(symbol)) : '—'}</p>
          <p className={`value-mono text-[11px] ${(quote?.change24h ?? 0) >= 0 ? 'text-emerald' : 'text-danger'}`}>{quote ? fmtPct(quote.change24h) : '·'}</p>
        </div>
      </div>
      <div className="mt-3">
        {error ? (
          <div className="flex h-[150px] items-center justify-center rounded-xl border border-white/[0.06] bg-ink-900/50 px-4 text-center text-[11px] text-muted">{error}</div>
        ) : (
          <svg viewBox={`0 0 ${w} ${h}`} className="h-[150px] w-full sm:h-[210px]" preserveAspectRatio="none">
            {[0.25, 0.5, 0.75].map((r) => (
              <line key={r} x1={0} x2={w} y1={pad + r * (h - pad * 2)} y2={pad + r * (h - pad * 2)} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 6" />
            ))}
            {view.map((c, i) => {
              const up = c.close >= c.open;
              const x = pad + i * bw + bw / 2;
              const bodyTop = y(Math.max(c.open, c.close));
              const bodyH = Math.max(1, Math.abs(y(c.open) - y(c.close)));
              return (
                <g key={c.time}>
                  <line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={up ? '#2ee6a8' : '#ff5b6e'} strokeWidth="1" opacity="0.7" />
                  <rect x={x - Math.max(1.2, bw * 0.32)} y={bodyTop} width={Math.max(2.4, bw * 0.64)} height={bodyH} fill={up ? '#2ee6a8' : '#ff5b6e'} opacity="0.92" rx="0.6" />
                </g>
              );
            })}
            {view.length > 0 && (
              <line x1={0} x2={w} y1={y(view[view.length - 1].close)} y2={y(view[view.length - 1].close)} stroke="#dfc088" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.55" />
            )}
          </svg>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted">
        <span>5m · {candles.length} candles</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald" /> streaming
        </span>
      </div>
    </div>
  );
}
