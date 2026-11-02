'use client';

import { useEffect, useState } from 'react';
import { performanceStats, type PerformanceStats } from '@/lib/indicators';
import { fmtMoney } from '@/lib/format';

type History = {
  closedPositions?: { realizedPnl: number; closedAt: string | null }[];
  binaryTrades?: { pnl: number; settledAt: string | null; result: string }[];
};

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return <div className="flex h-[54px] items-center justify-center text-[10.5px] text-muted">Equity curve builds as trades close</div>;
  const w = 260;
  const h = 54;
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 0);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - 4 - ((p - min) / span) * (h - 8)).toFixed(1)}`).join(' ');
  const up = points[points.length - 1] >= 0;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[54px] w-full" preserveAspectRatio="none" aria-label="Cumulative realized PnL curve">
      <path d={`${path} L${w},${h} L0,${h} Z`} fill={up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'} stroke="none" />
      <path d={path} fill="none" stroke={up ? '#10b981' : '#ef4444'} strokeWidth="1.6" />
      <line x1="0" x2={w} y1={h - 4 - ((0 - min) / span) * (h - 8)} y2={h - 4 - ((0 - min) / span) * (h - 8)} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" strokeWidth="0.8" />
    </svg>
  );
}

/** Realized-performance statistics computed from the account's closed trades. */
export function PerformanceCard({ accountId }: { accountId: string | null }) {
  const [stats, setStats] = useState<PerformanceStats | null>(null);

  useEffect(() => {
    if (!accountId) { setStats(null); return; }
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/trades/history?account=${encodeURIComponent(accountId)}`, { cache: 'no-store' });
        if (!r.ok) return;
        const j = (await r.json()) as History;
        const series = [
          ...(j.closedPositions ?? []).map((p) => ({ t: Date.parse(p.closedAt ?? '') || 0, pnl: p.realizedPnl })),
          ...(j.binaryTrades ?? []).filter((b) => b.result !== 'OPEN').map((b) => ({ t: Date.parse(b.settledAt ?? '') || 0, pnl: b.pnl })),
        ].sort((a, b) => a.t - b.t).map((x) => x.pnl);
        if (alive) setStats(performanceStats(series));
      } catch { /* quiet */ }
    };
    void load();
    const t = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, [accountId]);

  const money = (n: number | null) => (n == null ? '—' : fmtMoney(n));

  return (
    <section className="panel p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-white">Performance</h2>
        <span className="font-mono text-[10px] text-muted">closed trades · realized</span>
      </div>
      {!stats || stats.trades === 0 ? (
        <p className="mt-3 text-[11.5px] leading-relaxed text-muted">Statistics appear once your first trade closes — win rate, profit factor, drawdown and an equity curve, computed from your own fills.</p>
      ) : (
        <>
          <div className="mt-3"><Sparkline points={stats.equityCurve} /></div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2.5">
              <dt className="text-[10px] uppercase tracking-[.14em] text-muted">Net realized</dt>
              <dd className={`mt-1 font-mono font-semibold ${stats.netRealized >= 0 ? 'text-emerald' : 'text-siren'}`}>{stats.netRealized >= 0 ? '+' : ''}{money(stats.netRealized)}</dd>
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2.5">
              <dt className="text-[10px] uppercase tracking-[.14em] text-muted">Win rate</dt>
              <dd className="mt-1 font-mono font-semibold text-white">{stats.winRate == null ? '—' : `${Math.round(stats.winRate * 100)}%`} <span className="text-[10px] text-muted">({stats.wins}W / {stats.losses}L)</span></dd>
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2.5">
              <dt className="text-[10px] uppercase tracking-[.14em] text-muted">Profit factor</dt>
              <dd className="mt-1 font-mono font-semibold text-white">{stats.profitFactor == null ? '—' : stats.profitFactor.toFixed(2)}</dd>
              {stats.profitFactor == null && stats.trades > 0 && <p className="mt-0.5 text-[9.5px] text-muted">no losing trades yet</p>}
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2.5">
              <dt className="text-[10px] uppercase tracking-[.14em] text-muted">Max drawdown</dt>
              <dd className="mt-1 font-mono font-semibold text-white">{stats.maxDrawdown == null ? '—' : `-${money(stats.maxDrawdown)}`}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[10px] leading-relaxed text-muted">Computed locally from your closed positions and settled short-expiry trades. Undefined ratios are shown as — rather than estimated.</p>
        </>
      )}
    </section>
  );
}
