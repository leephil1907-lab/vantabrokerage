'use client';

import { useEffect, useState } from 'react';
import type { SignalSet } from '@/lib/indicators';

const fmt = (n: number | null | undefined, dp = 2) => (n == null || !Number.isFinite(n) ? '—' : n.toFixed(dp));

function rsiTone(v: number | null) {
  if (v == null) return 'text-muted';
  if (v >= 70) return 'text-siren';
  if (v <= 30) return 'text-emerald';
  return 'text-white';
}

/** Institutional-style technical lens for the active instrument (1h candles). */
export function SignalLens({ symbol }: { symbol: string }) {
  const [data, setData] = useState<SignalSet | { insufficient: true } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/markets/signals?symbol=${encodeURIComponent(symbol)}`, { cache: 'no-store' });
        if (!r.ok) { if (alive) setData(null); return; }
        const j = (await r.json()) as SignalSet | { insufficient: true };
        if (alive) setData(j);
      } catch { if (alive) setData(null); }
    };
    void load();
    const t = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, [symbol]);

  const s = data && !('insufficient' in data) ? data : null;

  return (
    <section className="panel p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-white">Signal lens</h2>
        <span className="font-mono text-[10px] text-muted">1h candles · provider data</span>
      </div>
      {!data ? (
        <p className="mt-3 text-[11.5px] text-muted">Loading technicals…</p>
      ) : !s ? (
        <p className="mt-3 text-[11.5px] text-muted">Not enough candle history for this instrument yet.</p>
      ) : (
        <dl className="mt-3 space-y-3 text-[11.5px]">
          <div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">RSI (14)</dt>
              <dd className={`font-mono font-semibold ${rsiTone(s.rsi14)}`}>{fmt(s.rsi14, 1)}</dd>
            </div>
            <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="absolute inset-y-0 left-[30%] w-[40%] bg-white/[0.07]" />
              {s.rsi14 != null && <div className="absolute inset-y-0 w-1.5 rounded-full bg-lime" style={{ left: `calc(${Math.min(100, Math.max(0, s.rsi14))}% - 3px)` }} />}
            </div>
            <p className="mt-1 text-[10px] text-muted">30 / 70 bands shaded · extremes flag stretched conditions</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2">
              <dt className="text-[10px] uppercase tracking-[.14em] text-muted">Trend</dt>
              <dd className={`mt-1 font-mono text-[12px] font-semibold ${s.trend === 'up' ? 'text-emerald' : s.trend === 'down' ? 'text-siren' : 'text-white'}`}>
                {s.trend === 'up' ? '▲ EMA20 > 50' : s.trend === 'down' ? '▼ EMA20 < 50' : s.trend === 'flat' ? '◆ Flat' : '—'}
              </dd>
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2">
              <dt className="text-[10px] uppercase tracking-[.14em] text-muted">Volatility</dt>
              <dd className="mt-1 font-mono text-[12px] font-semibold text-white">{s.atrPct == null ? '—' : `${fmt(s.atrPct, 2)}% ATR`}</dd>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Bollinger position (20, 2)</dt>
              <dd className="font-mono font-semibold text-white">{s.bbPosition == null ? '—' : `${Math.round(s.bbPosition * 100)}%`}</dd>
            </div>
            <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              {s.bbPosition != null && <div className="absolute inset-y-0 rounded-full bg-sky/70" style={{ left: 0, width: `${Math.round(s.bbPosition * 100)}%` }} />}
            </div>
            <p className="mt-1 text-[10px] text-muted">0% lower band · 100% upper band</p>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted">MACD (12, 26, 9)</dt>
            <dd className={`font-mono font-semibold ${s.macdHist == null ? 'text-muted' : s.macdHist >= 0 ? 'text-emerald' : 'text-siren'}`}>
              {s.macdHist == null ? '—' : s.macdHist >= 0 ? 'positive momentum' : 'negative momentum'}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}

/** The account's latest executions from the internal matching engine. */
export function RecentFills({ accountId }: { accountId: string }) {
  const [fills, setFills] = useState<{ id: string; symbol: string; side: string; qty: number; price: number; createdAt: string }[] | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/trades/history?account=${encodeURIComponent(accountId)}`, { cache: 'no-store' });
        if (!r.ok) return;
        const j = (await r.json()) as { executions?: typeof fills };
        if (alive) setFills((j.executions ?? []).slice(0, 5));
      } catch { /* stay quiet */ }
    };
    void load();
    const t = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(t); };
  }, [accountId]);

  return (
    <div className="mt-3 rounded-xl border border-white/[0.06] bg-ink-950/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">Recent executions</p>
      {!fills ? (
        <p className="mt-3 text-[11px] text-muted">Loading…</p>
      ) : fills.length === 0 ? (
        <p className="mt-3 text-[11px] leading-relaxed text-muted">No executions yet — fills from the internal matching engine appear here.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {fills.map((f) => (
            <li key={f.id} className="flex items-center justify-between font-mono text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className={f.side === 'BUY' ? 'text-emerald' : 'text-siren'}>{f.side}</span>
                <span className="text-white/80">{f.qty} {f.symbol}</span>
              </span>
              <span className="text-white/60">@ {f.price}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
