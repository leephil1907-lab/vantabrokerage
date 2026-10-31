'use client';

import { useCallback, useEffect, useState } from 'react';
import { AccountSwitcher, useAccount } from '@/components/terminal/account-bar';
import { Badge, EmptyState, apiFetch, useToast } from '@/components/ui';
import { fmtMoney, fmtPrice, fmtQty, fmtSigned, priceDp, relTime } from '@/lib/format';

type Position = { id: string; symbol: string; category: string; side: string; qty: number; entryPrice: number; markPrice: number | null; leverage: number; marginMode: string; initialMargin: number; liquidationPrice: number | null; takeProfit: number | null; stopLoss: number | null; unrealizedPnl: number; realizedPnl: number; status: string; openedAt: string; closedAt: string | null };

export default function PositionsPage() {
  const { accounts, accountId, select, active, liveEnabled, reloadAccounts } = useAccount();
  const [tab, setTab] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [positions, setPositions] = useState<Position[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const { push } = useToast();

  const load = useCallback(async () => {
    if (!accountId) return;
    try {
      const res = await apiFetch<{ positions: Position[] }>(`/api/trades/positions?accountId=${accountId}&status=${tab === 'OPEN' ? 'open' : 'closed'}`);
      setPositions(res.positions);
    } catch { /* polling */ }
  }, [accountId, tab]);

  useEffect(() => { load(); const id = setInterval(load, 8000); return () => clearInterval(id); }, [load]);

  const close = async (p: Position) => {
    setBusy(p.id);
    try {
      const res = await apiFetch<{ pnl: number; exitPrice: number }>(`/api/trades/positions/${p.id}`, { method: 'DELETE' });
      push({ tone: res.pnl >= 0 ? 'success' : 'info', title: `${p.symbol} closed`, body: `Exit ${fmtPrice(res.exitPrice, priceDp(p.symbol))} · realised ${fmtSigned(res.pnl)}` });
      load(); reloadAccounts();
    } catch (e) { push({ tone: 'error', title: 'Close failed', body: (e as Error).message }); }
    finally { setBusy(null); }
  };

  const editTpSl = async (p: Position) => {
    const tp = window.prompt(`Take profit for ${p.symbol} (blank to clear)`, p.takeProfit ? String(p.takeProfit) : '');
    if (tp === null) return;
    const sl = window.prompt(`Stop loss for ${p.symbol} (blank to clear)`, p.stopLoss ? String(p.stopLoss) : '');
    if (sl === null) return;
    try {
      await apiFetch(`/api/trades/positions/${p.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          takeProfit: tp.trim() ? Number(tp) : null,
          stopLoss: sl.trim() ? Number(sl) : null,
        }),
      });
      push({ tone: 'success', title: 'Protective orders updated', body: 'The risk engine will close the position when these levels are touched.' });
      load();
    } catch (e) { push({ tone: 'error', title: 'Update failed', body: (e as Error).message }); }
  };

  const totals = positions.reduce((s, p) => ({ margin: s.margin + p.initialMargin, upnl: s.upnl + p.unrealizedPnl, realised: s.realised + p.realizedPnl }), { margin: 0, upnl: 0, realised: 0 });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Positions</h1>
          <p className="mt-0.5 text-[12px] text-muted">Margin, mark price, liquidation price and P/L are computed server-side.</p>
        </div>
        <AccountSwitcher accounts={accounts} accountId={accountId} onSelect={select} active={active} liveEnabled={liveEnabled} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4"><p className="label">Margin in use</p><p className="value-mono mt-1 text-lg font-semibold text-white">{fmtMoney(totals.margin)}</p></div>
        <div className="panel p-4"><p className="label">Unrealised P/L</p><p className={`value-mono mt-1 text-lg font-semibold ${totals.upnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(totals.upnl)}</p></div>
        <div className="panel p-4"><p className="label">Realised (open lots)</p><p className="value-mono mt-1 text-lg font-semibold text-white">{fmtSigned(totals.realised)}</p></div>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex gap-1 border-b border-white/[0.07] px-3">
          {(['OPEN', 'CLOSED'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`relative px-3 py-2.5 text-[12.5px] font-medium ${tab === t ? 'text-white' : 'text-muted'}`}>
              {t === 'OPEN' ? 'Open positions' : 'Closed positions'}
              {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-lime" />}
            </button>
          ))}
        </div>
        {positions.length === 0 ? (
          <EmptyState title={tab === 'OPEN' ? 'No open positions' : 'No closed positions'} body={tab === 'OPEN' ? 'Open a trade from any terminal to see live P/L here.' : 'Positions appear here once closed, with realised P/L captured in your ledger.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Entry</th><th className="th text-right">Mark</th><th className="th text-right">Margin</th><th className="th text-right">TP / SL</th><th className="th text-right">Liq.</th><th className="th text-right">P/L</th><th className="th">Opened</th><th className="th"></th></tr></thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="td font-medium text-white">{p.symbol}<span className="ml-1.5 text-[10px] text-muted">{p.leverage}×</span></td>
                    <td className="td"><Badge tone={p.side === 'LONG' ? 'green' : 'red'}>{p.side}</Badge></td>
                    <td className="td text-right value-mono">{fmtQty(p.qty, 4)}</td>
                    <td className="td text-right value-mono">{fmtPrice(p.entryPrice, priceDp(p.symbol))}</td>
                    <td className="td text-right value-mono">{p.markPrice ? fmtPrice(p.markPrice, priceDp(p.symbol)) : '—'}</td>
                    <td className="td text-right value-mono">{fmtMoney(p.initialMargin)}</td>
                    <td className="td text-right value-mono text-[10.5px] text-muted">{p.takeProfit ? fmtPrice(p.takeProfit, priceDp(p.symbol)) : '—'} / {p.stopLoss ? fmtPrice(p.stopLoss, priceDp(p.symbol)) : '—'}</td>
                    <td className="td text-right value-mono text-[11px] text-siren">{p.liquidationPrice ? fmtPrice(p.liquidationPrice, priceDp(p.symbol)) : '—'}</td>
                    <td className={`td text-right value-mono ${(tab === 'OPEN' ? p.unrealizedPnl : p.realizedPnl) >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(tab === 'OPEN' ? p.unrealizedPnl : p.realizedPnl)}</td>
                    <td className="td text-[11px] text-muted">{relTime(p.openedAt)}</td>
                    <td className="td text-right">
                      {tab === 'OPEN' ? (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => editTpSl(p)} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-muted hover:text-white">TP/SL</button>
                          <button onClick={() => close(p)} disabled={busy === p.id} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-muted hover:border-danger/40 hover:text-danger">{busy === p.id ? '…' : 'Close'}</button>
                        </div>
                      ) : <span className="text-[10.5px] text-muted">{relTime(p.closedAt)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
