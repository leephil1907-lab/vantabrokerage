'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AccountSwitcher, useAccount } from '@/components/terminal/account-bar';
import { Badge, EmptyState, apiFetch, useToast } from '@/components/ui';
import { fmtMoney, fmtSigned, relTime } from '@/lib/format';

type Entry = { id: string; direction: string; amount: number; balanceAfter: number; type: string; description: string | null; createdAt: string };
type TxPayload = { available: number; locked: number; entries: Entry[] };
type Portfolio = { holdings: { asset: string; amount: number; price: number; valueUsd: number }[] };

export default function WalletPage() {
  const { accounts, accountId, select, active, liveEnabled, reloadAccounts } = useAccount();
  const [tx, setTx] = useState<TxPayload | null>(null);
  const [holdings, setHoldings] = useState<Portfolio['holdings']>([]);
  const [transfer, setTransfer] = useState({ to: '', amount: '' });
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const load = useCallback(async () => {
    if (!accountId) return;
    const [t, p] = await Promise.all([
      apiFetch<TxPayload>(`/api/wallet/transactions?accountId=${accountId}&limit=25`),
      apiFetch<Portfolio>(`/api/portfolio?accountId=${accountId}`),
    ]).catch(() => [null, null] as const);
    if (t) setTx(t);
    if (p) setHoldings(p.holdings);
  }, [accountId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const eligible = accounts.filter((a) => a.id !== accountId && a.type === active?.type);
    setTransfer((t) => eligible.some((a) => a.id === t.to) ? t : { ...t, to: eligible[0]?.id ?? '' });
  }, [accounts, accountId, active?.type]);

  const doTransfer = async () => {
    setBusy(true);
    try {
      const res = await apiFetch<{ amount: number; reference: string }>('/api/wallet/transfer', {
        method: 'POST',
        body: JSON.stringify({ fromAccountId: accountId, toAccountId: transfer.to, amount: Number(transfer.amount) }),
      });
      push({ tone: 'success', title: 'Transfer complete', body: `${fmtMoney(res.amount)} moved between accounts · ref ${res.reference}` });
      setTransfer((t) => ({ ...t, amount: '' }));
      load(); reloadAccounts();
    } catch (e) { push({ tone: 'error', title: 'Transfer failed', body: (e as Error).message }); }
    finally { setBusy(false); }
  };

  const target = accounts.find((a) => a.id === transfer.to);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Wallet</h1>
          <p className="mt-0.5 text-[12px] text-muted">One ledger across every terminal. Balances are derived from double-entry transactions.</p>
        </div>
        <AccountSwitcher accounts={accounts} accountId={accountId} onSelect={select} active={active} liveEnabled={liveEnabled} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4 ring-1 ring-lime/20">
          <p className="label">Available</p>
          <p className="value-mono mt-1.5 text-[22px] font-semibold text-white">{fmtMoney(tx?.available ?? active?.available ?? 0)}</p>
          <p className="mt-0.5 text-[10.5px] text-muted">{active?.type} account</p>
        </div>
        <div className="panel p-4">
          <p className="label">Locked</p>
          <p className="value-mono mt-1.5 text-[22px] font-semibold text-white">{fmtMoney(tx?.locked ?? active?.locked ?? 0)}</p>
          <p className="mt-0.5 text-[10.5px] text-muted">margin + pending withdrawals</p>
        </div>
        <div className="panel p-4">
          <p className="label">Crypto holdings</p>
          <p className="value-mono mt-1.5 text-[22px] font-semibold text-white">{fmtMoney(holdings.reduce((s, h) => s + h.valueUsd, 0))}</p>
          <p className="mt-0.5 text-[10.5px] text-muted">{holdings.length} assets</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <p className="text-[13px] font-semibold text-white">Recent ledger entries</p>
            <Link href="/dashboard/transactions" className="text-[11.5px] text-lime hover:underline">Full ledger</Link>
          </div>
          {!tx?.entries.length ? <EmptyState title="No ledger entries" body="Deposits, trades, transfers and fees all post here." /> : (
            <table className="w-full">
              <thead><tr><th className="th">Type</th><th className="th">Description</th><th className="th text-right">Amount</th><th className="th text-right">Balance</th><th className="th">Time</th></tr></thead>
              <tbody>
                {tx.entries.map((e) => (
                  <tr key={e.id} className="table-row">
                    <td className="td"><Badge tone={e.direction === 'CREDIT' ? 'green' : 'gray'}>{e.type.replace(/_/g, ' ')}</Badge></td>
                    <td className="td max-w-[220px] truncate text-[11.5px] text-muted">{e.description ?? '—'}</td>
                    <td className={`td text-right value-mono ${e.direction === 'CREDIT' ? 'text-emerald' : 'text-white'}`}>{e.direction === 'CREDIT' ? '+' : '−'}{fmtMoney(e.amount)}</td>
                    <td className="td text-right value-mono text-muted">{fmtMoney(e.balanceAfter)}</td>
                    <td className="td text-[11px] text-muted">{relTime(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div className="space-y-4">
          <section className="panel p-4">
            <p className="text-[13px] font-semibold text-white">Move funds between accounts</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">Transfers can only be made between eligible accounts of the same type.</p>
            <div className="mt-3 space-y-2.5">
              <label className="block">
                <span className="label">From</span>
                <input readOnly value={active ? `${active.type} · ${fmtMoney(active.available)}` : ''} className="field mt-1.5 opacity-70" />
              </label>
              <label className="block">
                <span className="label">To</span>
                <select disabled={!accounts.some((a) => a.id !== accountId && a.type === active?.type)} value={transfer.to} onChange={(e) => setTransfer((t) => ({ ...t, to: e.target.value }))} className="field mt-1.5">
                  <option value="">No eligible destination</option>
                  {accounts.filter((a) => a.id !== accountId && a.type === active?.type).map((a) => <option key={a.id} value={a.id}>{a.type} account</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">Amount</span>
                <input value={transfer.amount} onChange={(e) => setTransfer((t) => ({ ...t, amount: e.target.value }))} inputMode="decimal" placeholder="0.00" className="field mt-1.5" />
              </label>
              <button onClick={doTransfer} disabled={busy || !transfer.to || !Number(transfer.amount)} className="btn-primary w-full py-2 text-[12.5px]">
                {busy ? 'Transferring…' : `Transfer to ${target?.type ?? ''}`}
              </button>
            </div>
          </section>

          <section className="panel p-4">
            <p className="text-[13px] font-semibold text-white">Funding</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/dashboard/deposits" className="btn-ghost py-2 text-[12px]">Deposit</Link>
              <Link href="/dashboard/withdrawals" className="btn-ghost py-2 text-[12px]">Withdraw</Link>
            </div>
          </section>

          <section className="panel p-4">
            <p className="text-[13px] font-semibold text-white">Crypto holdings</p>
            {holdings.length === 0 ? <p className="mt-2 text-[11.5px] text-muted">No holdings yet.</p> : (
              <div className="mt-2 space-y-1.5">
                {holdings.map((h) => (
                  <div key={h.asset} className="flex items-center justify-between text-[11.5px]">
                    <span className="text-white">{h.asset}</span>
                    <span className="value-mono text-muted">{h.amount.toFixed(6)}</span>
                    <span className="value-mono text-white">{fmtMoney(h.valueUsd)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
