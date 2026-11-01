'use client';

import { useEffect, useState } from 'react';
import { AccountSwitcher, useAccount } from '@/components/terminal/account-bar';
import { EmptyState, apiFetch } from '@/components/ui';
import { fmtMoney, fmtPrice, fmtQty, fmtSigned, priceDp } from '@/lib/format';

type Portfolio = {
  equity: { available: number; locked: number; unrealizedPnl: number; realizedPnl: number; binaryAtRisk: number; marginUsed: number; equity: number };
  holdings: { asset: string; amount: number; price: number; valueUsd: number }[];
  positions: { id: string; symbol: string; side: string; qty: number; entryPrice: number; markPrice: number | null; unrealizedPnl: number; leverage: number; margin: number }[];
  allocation: { cash: number; marginLocked: number; binaryAtRisk: number; assets: number; positionsGross: number };
};

export default function PortfolioPage() {
  const { accounts, accountId, select, active, liveEnabled } = useAccount();
  const [data, setData] = useState<Portfolio | null>(null);

  useEffect(() => {
    if (!accountId) return;
    const load = () => apiFetch<Portfolio>(`/api/portfolio?accountId=${accountId}`).then(setData).catch(() => undefined);
    load();
    const id = setInterval(load, 12_000);
    return () => clearInterval(id);
  }, [accountId]);

  const total = data ? data.allocation.cash + data.allocation.marginLocked + data.allocation.assets : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Portfolio</h1>
          <p className="mt-0.5 text-[12px] text-muted">Cash, margin, crypto holdings and open exposure valued from live quotes.</p>
        </div>
        <AccountSwitcher accounts={accounts} accountId={accountId} onSelect={select} active={active} liveEnabled={liveEnabled} />
      </div>

      {!data ? <div className="panel p-8 text-center text-[12px] text-muted">Loading portfolio…</div> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card label="Total equity" value={fmtMoney(data.equity.equity)} accent />
            <Card label="Cash available" value={fmtMoney(data.equity.available)} />
            <Card label="Margin locked" value={fmtMoney(data.equity.marginUsed)} />
            <Card label="Unrealised P/L" value={fmtSigned(data.equity.unrealizedPnl)} tone={data.equity.unrealizedPnl >= 0 ? 'up' : 'down'} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="panel p-4">
              <p className="label">Allocation</p>
              <div className="mt-3 space-y-2.5">
                {[
                  ['Cash', data.allocation.cash, '#dfc088'],
                  ['Margin locked', data.allocation.marginLocked, '#38bdf8'],
                  ['Crypto holdings', data.allocation.assets, '#2ee6a8'],
                  ['Short-expiry at risk', data.allocation.binaryAtRisk, '#ffb020'],
                ].map(([label, value, color]) => {
                  const pct = total > 0 ? (Number(value) / total) * 100 : 0;
                  return (
                    <div key={label as string}>
                      <div className="flex justify-between text-[11.5px]"><span className="text-muted">{label}</span><span className="value-mono text-white">{fmtMoney(Number(value))} · {pct.toFixed(1)}%</span></div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: color as string }} /></div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="panel p-4">
              <p className="label">Crypto holdings</p>
              {data.holdings.length === 0 ? (
                <EmptyState title="No crypto holdings" body="Buy crypto on the spot terminal to build a holding position." />
              ) : (
                <table className="mt-2 w-full">
                  <thead><tr><th className="th px-0">Asset</th><th className="th px-0 text-right">Amount</th><th className="th px-0 text-right">Price</th><th className="th px-0 text-right">Value</th></tr></thead>
                  <tbody>
                    {data.holdings.map((h) => (
                      <tr key={h.asset}>
                        <td className="td px-0 font-medium text-white">{h.asset}</td>
                        <td className="td px-0 text-right value-mono">{fmtQty(h.amount, 6)}</td>
                        <td className="td px-0 text-right value-mono">{h.price ? fmtMoney(h.price) : '—'}</td>
                        <td className="td px-0 text-right value-mono">{fmtMoney(h.valueUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          <section className="panel overflow-hidden">
            <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-[13px] font-semibold text-white">Open exposure</p></div>
            {data.positions.length === 0 ? <EmptyState title="No open exposure" body="Derivative positions and their margin appear here." /> : (
              <table className="w-full min-w-[600px]">
                <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Entry</th><th className="th text-right">Mark</th><th className="th text-right">Margin</th><th className="th text-right">P/L</th></tr></thead>
                <tbody>
                  {data.positions.map((p) => (
                    <tr key={p.id} className="table-row">
                      <td className="td font-medium text-white">{p.symbol}<span className="ml-1 text-[10px] text-muted">{p.leverage}×</span></td>
                      <td className="td text-[11.5px] text-muted">{p.side}</td>
                      <td className="td text-right value-mono">{fmtQty(p.qty, 4)}</td>
                      <td className="td text-right value-mono">{fmtPrice(p.entryPrice, priceDp(p.symbol))}</td>
                      <td className="td text-right value-mono">{fmtPrice(p.markPrice, priceDp(p.symbol))}</td>
                      <td className="td text-right value-mono">{fmtMoney(p.margin)}</td>
                      <td className={`td text-right value-mono ${p.unrealizedPnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(p.unrealizedPnl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Card({ label, value, tone, accent }: { label: string; value: string; tone?: 'up' | 'down'; accent?: boolean }) {
  return (
    <div className={`panel p-4 ${accent ? 'ring-1 ring-lime/20' : ''}`}>
      <p className="label">{label}</p>
      <p className={`value-mono mt-1.5 text-[19px] font-semibold ${tone === 'up' ? 'text-emerald' : tone === 'down' ? 'text-danger' : 'text-white'}`}>{value}</p>
    </div>
  );
}
