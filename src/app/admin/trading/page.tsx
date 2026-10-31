'use client';

import { useEffect, useState } from 'react';
import { Badge, EmptyState, StatusBadge, apiFetch } from '@/components/ui';
import { fmtMoney, fmtPrice, fmtQty, fmtSigned, relTime } from '@/lib/format';

export default function AdminTrading() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'orders' | 'positions' | 'liquidations'>('positions');

  useEffect(() => {
    const load = () => apiFetch('/api/admin/orders').then(setData).catch(() => undefined);
    load();
    const id = setInterval(load, 12_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Trading oversight</h1>
          <p className="mt-0.5 text-[12px] text-muted">Platform-wide orders, open exposure and liquidation events.</p>
        </div>
        {data && (
          <div className="flex gap-2">
            <span className="chip">gross exposure {fmtMoney(data.exposure)}</span>
            <span className="chip">{data.openBinary} short-expiry open</span>
          </div>
        )}
      </div>

      <div className="flex gap-1 rounded-lg bg-ink-900 p-1 sm:w-fit">
        {(['positions', 'orders', 'liquidations'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 text-[12px] font-medium capitalize ${tab === t ? 'bg-white/10 text-white' : 'text-muted'}`}>{t}</button>
        ))}
      </div>

      <div className="panel overflow-hidden">
        {!data ? <div className="p-8 text-center text-[12px] text-muted">Loading…</div> : tab === 'positions' ? (
          data.positions.length === 0 ? <EmptyState title="No open positions" body="Positions opened by clients appear here with live mark and P/L." /> : (
            <table className="w-full min-w-[860px]">
              <thead><tr><th className="th">Client</th><th className="th">Market</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Entry</th><th className="th text-right">Mark</th><th className="th text-right">Lev.</th><th className="th text-right">P/L</th><th className="th">Opened</th></tr></thead>
              <tbody>
                {data.positions.map((p: any) => (
                  <tr key={p.id} className="table-row">
                    <td className="td text-[11.5px] text-white">{p.email}</td>
                    <td className="td text-white">{p.symbol}</td>
                    <td className="td"><Badge tone={p.side === 'LONG' ? 'green' : 'red'}>{p.side}</Badge></td>
                    <td className="td text-right value-mono">{fmtQty(p.qty, 4)}</td>
                    <td className="td text-right value-mono">{fmtPrice(p.entryPrice)}</td>
                    <td className="td text-right value-mono">{p.markPrice ? fmtPrice(p.markPrice) : '—'}</td>
                    <td className="td text-right value-mono text-[11px]">{p.leverage}×</td>
                    <td className={`td text-right value-mono ${p.unrealizedPnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(p.unrealizedPnl)}</td>
                    <td className="td text-[11px] text-muted">{relTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : tab === 'orders' ? (
          data.orders.length === 0 ? <EmptyState title="No orders" body="Client orders and executions appear here." /> : (
            <table className="w-full min-w-[940px]">
              <thead><tr><th className="th">Client</th><th className="th">Market</th><th className="th">Side</th><th className="th">Type</th><th className="th">Status</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th text-right">Avg fill</th><th className="th text-right">Fee</th><th className="th">Placed</th></tr></thead>
              <tbody>
                {data.orders.map((o: any) => (
                  <tr key={o.id} className="table-row">
                    <td className="td text-[11.5px] text-white">{o.email}<span className="ml-1 text-[10px] text-muted">{o.accountType}</span></td>
                    <td className="td text-white">{o.symbol}</td>
                    <td className="td"><Badge tone={o.side === 'BUY' ? 'green' : 'red'}>{o.side}</Badge></td>
                    <td className="td text-[11px] text-muted">{o.type}</td>
                    <td className="td"><StatusBadge status={o.status} /></td>
                    <td className="td text-right value-mono">{fmtQty(o.qty, 4)}</td>
                    <td className="td text-right value-mono">{o.price ? fmtPrice(o.price) : 'market'}</td>
                    <td className="td text-right value-mono">{o.avgFillPrice ? fmtPrice(o.avgFillPrice) : '—'}</td>
                    <td className="td text-right value-mono">{fmtMoney(o.fee)}</td>
                    <td className="td text-[11px] text-muted">{relTime(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          data.liquidations.length === 0 ? <EmptyState title="No liquidations" body="Liquidation events from the risk engine are recorded here." /> : (
            <table className="w-full">
              <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th text-right">Loss</th><th className="th">When</th></tr></thead>
              <tbody>
                {data.liquidations.map((l: any) => (
                  <tr key={l.id} className="table-row">
                    <td className="td text-white">{l.symbol}</td>
                    <td className="td"><Badge tone={l.side === 'LONG' ? 'green' : 'red'}>{l.side}</Badge></td>
                    <td className="td text-right value-mono">{fmtQty(l.qty, 4)}</td>
                    <td className="td text-right value-mono">{fmtPrice(l.price)}</td>
                    <td className="td text-right value-mono text-danger">{fmtMoney(l.lossAmount)}</td>
                    <td className="td text-[11px] text-muted">{relTime(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}
