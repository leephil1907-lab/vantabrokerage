'use client';

import { useEffect, useState } from 'react';
import { AccountSwitcher, useAccount } from '@/components/terminal/account-bar';
import { Badge, EmptyState, apiFetch } from '@/components/ui';
import { fmtMoney, relTime } from '@/lib/format';

type Entry = { id: string; direction: string; amount: number; balanceAfter: number; type: string; status: string; description: string | null; reference: string | null; metadata: Record<string, unknown>; createdAt: string };

export default function TransactionsPage() {
  const { accounts, accountId, select, active, liveEnabled } = useAccount();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (!accountId) return;
    apiFetch<{ entries: Entry[] }>(`/api/wallet/transactions?accountId=${accountId}&limit=300`)
      .then((b) => setEntries(b.entries))
      .catch(() => undefined);
  }, [accountId]);

  const types = ['ALL', ...Array.from(new Set(entries.map((e) => e.type)))];
  const rows = entries.filter((e) => filter === 'ALL' || e.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Transactions</h1>
          <p className="mt-0.5 text-[12px] text-muted">Immutable double-entry ledger for this account — every balance change with its counterparty entry.</p>
        </div>
        <AccountSwitcher accounts={accounts} accountId={accountId} onSelect={select} active={active} liveEnabled={liveEnabled} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {types.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${filter === t ? 'border-lime/40 bg-lime/10 text-lime' : 'border-white/10 text-muted hover:text-white'}`}>
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="panel overflow-hidden">
        {rows.length === 0 ? <EmptyState title="No transactions" body="Ledger entries appear as you trade, deposit, withdraw and transfer." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead><tr><th className="th">Time</th><th className="th">Type</th><th className="th">Description</th><th className="th text-right">Amount</th><th className="th text-right">Balance after</th><th className="th">Status</th><th className="th">Reference</th></tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="table-row">
                    <td className="td whitespace-nowrap text-[11px] text-muted">{new Date(e.createdAt).toLocaleString('en-GB')}</td>
                    <td className="td"><Badge tone={e.direction === 'CREDIT' ? 'green' : 'gray'}>{e.type.replace(/_/g, ' ')}</Badge></td>
                    <td className="td max-w-[260px] truncate text-[11.5px] text-muted">{e.description ?? '—'}</td>
                    <td className={`td text-right value-mono ${e.direction === 'CREDIT' ? 'text-emerald' : 'text-white'}`}>{e.direction === 'CREDIT' ? '+' : '−'}{fmtMoney(e.amount)}</td>
                    <td className="td text-right value-mono text-muted">{fmtMoney(e.balanceAfter)}</td>
                    <td className="td text-[11px] text-muted">{e.status}</td>
                    <td className="td max-w-[160px] truncate value-mono text-[10px] text-muted">{e.reference ?? '—'}</td>
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
