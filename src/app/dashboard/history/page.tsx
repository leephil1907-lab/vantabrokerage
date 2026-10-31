'use client';

import { useEffect, useState } from 'react';
import { AccountSwitcher, useAccount } from '@/components/terminal/account-bar';
import { Badge, EmptyState, StatusBadge, Tabs, apiFetch } from '@/components/ui';
import { fmtMoney, fmtPrice, fmtQty, fmtSigned, priceDp, relTime } from '@/lib/format';

type Payload = {
  closedPositions: { id: string; symbol: string; side: string; qty: number; entryPrice: number; exitPrice: number | null; realizedPnl: number; feesPaid: number; leverage: number; closedAt: string | null }[];
  executions: { id: string; symbol: string; side: string; qty: number; price: number; fee: number; venue: string; quoteTs: string; createdAt: string }[];
  binaryTrades: { id: string; symbol: string; direction: string; stake: number; payoutRate: number; entryPrice: number; settlePrice: number | null; result: string; pnl: number; env: string; settledAt: string | null; entryQuoteTs: string; exitQuoteTs: string | null }[];
  funding: { id: string; symbol: string; rate: number; amount: number; fundingTime: string }[];
  liquidations: { id: string; symbol: string; side: string; qty: number; price: number; lossAmount: number; createdAt: string }[];
};
type Tab = 'closed' | 'executions' | 'binary' | 'funding' | 'liquidations';

export default function HistoryPage() {
  const { accounts, accountId, select, active, liveEnabled } = useAccount();
  const [tab, setTab] = useState<Tab>('closed');
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    if (!accountId) return;
    apiFetch<Payload>(`/api/trades/history?accountId=${accountId}`).then(setData).catch(() => undefined);
  }, [accountId]);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'closed', label: 'Closed positions', count: data?.closedPositions.length },
    { id: 'executions', label: 'Executions', count: data?.executions.length },
    { id: 'binary', label: 'Short-expiry', count: data?.binaryTrades.length },
    { id: 'funding', label: 'Funding', count: data?.funding.length },
    { id: 'liquidations', label: 'Liquidations', count: data?.liquidations.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Trade history</h1>
          <p className="mt-0.5 text-[12px] text-muted">Every fill records its quote timestamp and venue so results can be reconciled.</p>
        </div>
        <AccountSwitcher accounts={accounts} accountId={accountId} onSelect={select} active={active} liveEnabled={liveEnabled} />
      </div>

      <div className="panel overflow-hidden">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        {tab === 'closed' && (!data?.closedPositions.length ? <EmptyState title="No closed positions" body="Once you close a position its realised P/L is recorded here." /> : (
          <table className="w-full min-w-[720px]">
            <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Entry</th><th className="th text-right">Exit</th><th className="th text-right">Fees</th><th className="th text-right">Realised</th><th className="th">Closed</th></tr></thead>
            <tbody>
              {data.closedPositions.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="td font-medium text-white">{p.symbol}<span className="ml-1 text-[10px] text-muted">{p.leverage}×</span></td>
                  <td className="td"><Badge tone={p.side === 'LONG' ? 'green' : 'red'}>{p.side}</Badge></td>
                  <td className="td text-right value-mono">{fmtQty(p.qty, 4)}</td>
                  <td className="td text-right value-mono">{fmtPrice(p.entryPrice, priceDp(p.symbol))}</td>
                  <td className="td text-right value-mono">{fmtPrice(p.exitPrice, priceDp(p.symbol))}</td>
                  <td className="td text-right value-mono text-muted">{fmtMoney(p.feesPaid)}</td>
                  <td className={`td text-right value-mono ${p.realizedPnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(p.realizedPnl)}</td>
                  <td className="td text-[11px] text-muted">{relTime(p.closedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
        {tab === 'executions' && (!data?.executions.length ? <EmptyState title="No executions" body="Each fill is written to an execution record with the quote timestamp used." /> : (
          <table className="w-full min-w-[720px]">
            <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th text-right">Fee</th><th className="th">Venue</th><th className="th">Quote ts</th></tr></thead>
            <tbody>
              {data.executions.map((e) => (
                <tr key={e.id} className="table-row">
                  <td className="td font-medium text-white">{e.symbol}</td>
                  <td className="td"><Badge tone={e.side === 'BUY' ? 'green' : 'red'}>{e.side}</Badge></td>
                  <td className="td text-right value-mono">{fmtQty(e.qty, 6)}</td>
                  <td className="td text-right value-mono">{fmtPrice(e.price, priceDp(e.symbol))}</td>
                  <td className="td text-right value-mono text-muted">{fmtMoney(e.fee)}</td>
                  <td className="td text-[11px] text-muted">{e.venue}</td>
                  <td className="td text-[11px] text-muted">{new Date(e.quoteTs).toLocaleString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
        {tab === 'binary' && (!data?.binaryTrades.length ? <EmptyState title="No settled short-expiry contracts" body="Settled contracts appear here with entry/exit quotes and the resulting P/L." /> : (
          <table className="w-full min-w-[820px]">
            <thead><tr><th className="th">Market</th><th className="th">Direction</th><th className="th text-right">Stake</th><th className="th text-right">Entry</th><th className="th text-right">Settle</th><th className="th">Result</th><th className="th text-right">P/L</th><th className="th">Env</th><th className="th">Quotes</th></tr></thead>
            <tbody>
              {data.binaryTrades.map((t) => (
                <tr key={t.id} className="table-row">
                  <td className="td font-medium text-white">{t.symbol.replace('-BIN', '')}</td>
                  <td className="td"><Badge tone={t.direction === 'CALL' ? 'green' : 'red'}>{t.direction}</Badge></td>
                  <td className="td text-right value-mono">{fmtMoney(t.stake)}</td>
                  <td className="td text-right value-mono">{fmtPrice(t.entryPrice, priceDp(t.symbol))}</td>
                  <td className="td text-right value-mono">{fmtPrice(t.settlePrice, priceDp(t.symbol))}</td>
                  <td className="td"><StatusBadge status={t.result} /></td>
                  <td className={`td text-right value-mono ${t.pnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(t.pnl)}</td>
                  <td className="td"><Badge tone={t.env === 'PAPER' ? 'blue' : 'lime'}>{t.env}</Badge></td>
                  <td className="td text-[10.5px] text-muted">{new Date(t.entryQuoteTs).toLocaleTimeString('en-GB')} → {t.exitQuoteTs ? new Date(t.exitQuoteTs).toLocaleTimeString('en-GB') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
        {tab === 'funding' && (!data?.funding.length ? <EmptyState title="No funding payments" body="Perpetual futures funding is applied by the worker every 8 hours." /> : (
          <table className="w-full">
            <thead><tr><th className="th">Contract</th><th className="th text-right">Rate</th><th className="th text-right">Amount</th><th className="th">Time</th></tr></thead>
            <tbody>
              {data.funding.map((f) => (
                <tr key={f.id} className="table-row">
                  <td className="td font-medium text-white">{f.symbol}</td>
                  <td className="td text-right value-mono">{(f.rate * 100).toFixed(4)}%</td>
                  <td className={`td text-right value-mono ${f.amount >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(f.amount)}</td>
                  <td className="td text-[11px] text-muted">{relTime(f.fundingTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
        {tab === 'liquidations' && (!data?.liquidations.length ? <EmptyState title="No liquidation events" body="Liquidations are recorded by the risk engine when a position's margin ratio falls below maintenance." /> : (
          <table className="w-full">
            <thead><tr><th className="th">Contract</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th text-right">Loss</th><th className="th">Time</th></tr></thead>
            <tbody>
              {data.liquidations.map((l) => (
                <tr key={l.id} className="table-row">
                  <td className="td font-medium text-white">{l.symbol}</td>
                  <td className="td"><Badge tone={l.side === 'LONG' ? 'green' : 'red'}>{l.side}</Badge></td>
                  <td className="td text-right value-mono">{fmtQty(l.qty, 4)}</td>
                  <td className="td text-right value-mono">{fmtPrice(l.price, priceDp(l.symbol))}</td>
                  <td className="td text-right value-mono text-danger">{fmtMoney(l.lossAmount)}</td>
                  <td className="td text-[11px] text-muted">{relTime(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
}
