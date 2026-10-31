'use client';

import { useCallback, useEffect, useState } from 'react';
import { AccountSwitcher, useAccount } from '@/components/terminal/account-bar';
import { Badge, EmptyState, StatusBadge, apiFetch, useToast } from '@/components/ui';
import { fmtMoney, fmtPrice, fmtQty, priceDp, relTime } from '@/lib/format';

type Order = { id: string; symbol: string; side: string; type: string; status: string; qty: number; price: number | null; filledQty: number; avgFillPrice: number | null; leverage: number; marginMode: string; fee: number; reserved: number; takeProfit: number | null; stopLoss: number | null; rejectReason: string | null; createdAt: string; filledAt: string | null; cancelledAt: string | null; expiresAt: string | null };

export default function OrdersPage() {
  const { accounts, accountId, select, active, liveEnabled, reloadAccounts } = useAccount();
  const [tab, setTab] = useState<'open' | 'history'>('open');
  const [orders, setOrders] = useState<Order[]>([]);
  const { push } = useToast();

  const load = useCallback(async () => {
    if (!accountId) return;
    try {
      const res = await apiFetch<{ orders: Order[] }>(`/api/trades/orders?accountId=${accountId}&status=${tab}`);
      setOrders(res.orders);
    } catch { /* polling */ }
  }, [accountId, tab]);

  useEffect(() => { load(); const id = setInterval(load, 8000); return () => clearInterval(id); }, [load]);

  const cancel = async (o: Order) => {
    try {
      await apiFetch(`/api/trades/orders/${o.id}`, { method: 'DELETE' });
      push({ tone: 'success', title: 'Order cancelled', body: `Reserved margin of ${fmtMoney(o.reserved)} released.` });
      load(); reloadAccounts();
    } catch (e) { push({ tone: 'error', title: 'Cancel failed', body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Orders</h1>
          <p className="mt-0.5 text-[12px] text-muted">Market, limit and stop orders with reserved-margin accounting and execution records.</p>
        </div>
        <AccountSwitcher accounts={accounts} accountId={accountId} onSelect={select} active={active} liveEnabled={liveEnabled} />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex gap-1 border-b border-white/[0.07] px-3">
          {(['open', 'history'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`relative px-3 py-2.5 text-[12.5px] font-medium ${tab === t ? 'text-white' : 'text-muted'}`}>
              {t === 'open' ? 'Open orders' : 'Order history'}
              {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-lime" />}
            </button>
          ))}
        </div>
        {orders.length === 0 ? (
          <EmptyState title={tab === 'open' ? 'No open orders' : 'No order history'} body={tab === 'open' ? 'Limit and stop orders rest here until filled, cancelled or expired.' : 'Filled, cancelled and rejected orders appear here with their execution details.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th">Type</th><th className="th">Status</th><th className="th text-right">Qty</th><th className="th text-right">Filled</th><th className="th text-right">Price</th><th className="th text-right">Avg fill</th><th className="th text-right">Reserved</th><th className="th text-right">Fee</th><th className="th">Placed</th><th className="th"></th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="table-row">
                    <td className="td font-medium text-white">{o.symbol}<span className="ml-1 text-[10px] text-muted">{o.leverage}×</span></td>
                    <td className="td"><Badge tone={o.side === 'BUY' ? 'green' : 'red'}>{o.side}</Badge></td>
                    <td className="td text-[11.5px] text-muted">{o.type}</td>
                    <td className="td"><StatusBadge status={o.status} /></td>
                    <td className="td text-right value-mono">{fmtQty(o.qty, 4)}</td>
                    <td className="td text-right value-mono">{fmtQty(o.filledQty, 4)}</td>
                    <td className="td text-right value-mono">{o.price ? fmtPrice(o.price, priceDp(o.symbol)) : 'market'}</td>
                    <td className="td text-right value-mono">{o.avgFillPrice ? fmtPrice(o.avgFillPrice, priceDp(o.symbol)) : '—'}</td>
                    <td className="td text-right value-mono text-muted">{fmtMoney(o.reserved)}</td>
                    <td className="td text-right value-mono text-muted">{fmtMoney(o.fee)}</td>
                    <td className="td text-[11px] text-muted">{relTime(o.createdAt)}</td>
                    <td className="td text-right">
                      {o.status === 'OPEN' && <button onClick={() => cancel(o)} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-muted hover:border-danger/40 hover:text-danger">Cancel</button>}
                      {o.rejectReason && <span className="text-[10px] text-danger">{o.rejectReason}</span>}
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
