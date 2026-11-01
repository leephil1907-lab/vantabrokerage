'use client';
import { useEffect, useState } from 'react';
import { fmtPct, fmtPrice } from '@/lib/format';
import { marketStatus } from '@/lib/market-sessions';
import { countdown } from '@/lib/format';

type DiscoveryAsset = { id: string; symbol: string; name: string; priceUsd: number | null; change24h: number | null; image?: string };
type MarketRow = { symbol: string; category: string; last: number | null; change24h: number | null };

/** Discovery strip: top movers across the configured catalogue and the wider
 *  crypto universe, plus an auto-generated brief assembled from live reference
 *  data and the global session clock. No editorial claims, no external copy. */
export function MarketMovers() {
  const [assets, setAssets] = useState<DiscoveryAsset[]>([]);
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [d, m] = await Promise.all([
          fetch('/api/markets/crypto-discovery', { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/markets', { cache: 'no-store' }).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setAssets(d.assets ?? []);
        setRows(m.markets ?? []);
        setNow(new Date());
      } catch { /* keep last known */ }
    };
    void load();
    const t = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const ranked = assets.filter((a) => a.change24h != null && a.priceUsd != null);
  const gainers = [...ranked].sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0)).slice(0, 4);
  const losers = [...ranked].sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0)).slice(0, 4);
  const configured = rows.filter((r) => r.last != null && r.change24h != null).sort((a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0)).slice(0, 4);
  const status = now ? marketStatus(now) : null;
  const btc = assets.find((a) => a.symbol === 'BTC');

  const brief: string[] = [];
  if (status) brief.push(status.fxOpen ? 'Currency centres are in session — liquidity windows are open across the active regions.' : `Currency markets are between sessions${status.nextOpenLabel ? `; ${status.nextOpenLabel} opens in ${countdown(status.nextOpenMs ?? 0)}` : ''}. Crypto venues continue around the clock.`);
  if (btc?.priceUsd) brief.push(`Bitcoin references at $${fmtPrice(btc.priceUsd, 0)} (${fmtPct(btc.change24h)} over 24h) set the tone for digital-asset risk.`);
  if (gainers[0]) brief.push(`${gainers[0].name} leads the large-cap movers at ${fmtPct(gainers[0].change24h)}, while ${losers[0]?.name ?? 'the laggards'} trades at ${fmtPct(losers[0]?.change24h)}.`);

  return (
    <section className="panel p-4 sm:p-5" aria-labelledby="movers-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><h2 id="movers-title" className="text-[15px] font-semibold text-white">Market discovery</h2><p className="text-[11px] text-muted">Top movers and an auto-generated brief from live market data</p></div>
        <span className="text-[10px] uppercase tracking-[.16em] text-muted">refreshed every minute</span>
      </div>
      {brief.length > 0 && (
        <div className="mb-4 rounded-xl border border-lime/20 bg-lime/[0.05] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-lime">Market brief · auto-generated</p>
          <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-white/80">{brief.map((b, i) => <li key={i}>• {b}</li>)}</ul>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <MoverColumn title="Configured markets · most active" items={configured.map((r) => ({ symbol: r.symbol, name: r.symbol, price: r.last ?? 0, change: r.change24h ?? 0 }))} />
        <MoverColumn title="Crypto gainers · 24h" items={gainers.map((a) => ({ symbol: a.symbol.toUpperCase(), name: a.name, price: a.priceUsd ?? 0, change: a.change24h ?? 0 }))} tone="up" />
        <MoverColumn title="Crypto losers · 24h" items={losers.map((a) => ({ symbol: a.symbol.toUpperCase(), name: a.name, price: a.priceUsd ?? 0, change: a.change24h ?? 0 }))} tone="down" />
      </div>
    </section>
  );
}

function MoverColumn({ title, items, tone }: { title: string; items: { symbol: string; name: string; price: number; change: number }[]; tone?: 'up' | 'down' }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-muted">{title}</p>
      <ul className="space-y-1.5">
        {items.length === 0 && <li className="text-[11.5px] text-muted">Waiting for data…</li>}
        {items.map((it) => (
          <li key={it.symbol} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
            <span className="min-w-0"><strong className="block truncate text-[12px] font-semibold text-white">{it.symbol}</strong><span className="block truncate text-[10px] text-muted">{it.name}</span></span>
            <span className="text-right"><span className="block font-mono text-[11.5px] text-white">{fmtPrice(it.price, it.price < 1 ? 4 : 2)}</span>
              <span className={`block font-mono text-[10.5px] ${tone === 'down' ? 'text-danger' : tone === 'up' ? 'text-emerald' : (it.change >= 0 ? 'text-emerald' : 'text-danger')}`}>{fmtPct(it.change)}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
