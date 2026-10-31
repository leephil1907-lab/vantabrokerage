'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, EmptyState, StatusBadge, apiFetch, useToast, Modal } from '@/components/ui';
import { fmtMoney, relTime } from '@/lib/format';

type Deposit = { id: string; email: string; accountType: string; status: string; asset: string; network: string | null; address: string | null; txHash: string | null; amount: number; creditedAmount: number | null; confirmations: number; requiredConfirmations: number; provider: string | null; metadata: any; createdAt: string };
type Withdrawal = { id: string; email: string; kycStatus: string; status: string; asset: string; network: string; address: string; amount: number; fee: number; netAmount: number; txHash: string | null; provider: string | null; reviewNote: string | null; twoFactorVerified: boolean; createdAt: string };

export default function AdminWallets() {
  const [tab, setTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [modal, setModal] = useState<{ kind: 'credit' | 'rejectDeposit' | 'approve' | 'rejectWithdrawal' | 'complete'; id: string; label: string } | null>(null);
  const [form, setForm] = useState({ amount: '', note: '', txHash: '' });
  const { push } = useToast();

  const load = useCallback(() => {
    apiFetch<{ deposits: Deposit[] }>('/api/admin/deposits').then((b) => setDeposits(b.deposits)).catch(() => undefined);
    apiFetch<{ withdrawals: Withdrawal[] }>('/api/admin/withdrawals').then((b) => setWithdrawals(b.withdrawals)).catch(() => undefined);
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 15_000); return () => clearInterval(id); }, [load]);

  const run = async () => {
    if (!modal) return;
    try {
      if (modal.kind === 'credit') {
        await apiFetch(`/api/admin/deposits/${modal.id}`, { method: 'POST', body: JSON.stringify({ action: 'credit', amount: form.amount ? Number(form.amount) : undefined, note: form.note }) });
        push({ tone: 'success', title: 'Deposit credited', body: 'A DEPOSIT ledger transaction was posted and the client was notified.' });
      } else if (modal.kind === 'rejectDeposit') {
        await apiFetch(`/api/admin/deposits/${modal.id}`, { method: 'POST', body: JSON.stringify({ action: 'reject', note: form.note }) });
        push({ tone: 'success', title: 'Deposit rejected' });
      } else if (modal.kind === 'approve') {
        const res = await apiFetch<{ status: string; note?: string }>(`/api/admin/withdrawals/${modal.id}`, { method: 'POST', body: JSON.stringify({ action: 'approve', note: form.note }) });
        push({ tone: 'success', title: `Withdrawal ${res.status.toLowerCase()}`, body: res.note });
      } else if (modal.kind === 'rejectWithdrawal') {
        await apiFetch(`/api/admin/withdrawals/${modal.id}`, { method: 'POST', body: JSON.stringify({ action: 'reject', note: form.note }) });
        push({ tone: 'success', title: 'Withdrawal rejected', body: 'Reserved funds returned to the client balance.' });
      } else {
        await apiFetch(`/api/admin/withdrawals/${modal.id}`, { method: 'POST', body: JSON.stringify({ action: 'mark_completed', txHash: form.txHash, note: form.note }) });
        push({ tone: 'success', title: 'Withdrawal completed', body: 'Reserved funds settled out of the ledger.' });
      }
      setModal(null); setForm({ amount: '', note: '', txHash: '' });
      load();
    } catch (e) { push({ tone: 'error', title: 'Action failed', body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Wallet operations</h1>
        <p className="mt-0.5 text-[12px] text-muted">Deposit verification, credit approval and withdrawal authorisation. Every action is audit-logged.</p>
      </div>

      <div className="flex gap-1 rounded-lg bg-ink-900 p-1 sm:w-fit">
        {(['deposits', 'withdrawals'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 text-[12px] font-medium capitalize ${tab === t ? 'bg-white/10 text-white' : 'text-muted'}`}>{t}</button>
        ))}
      </div>

      {tab === 'deposits' && (
        <div className="panel overflow-hidden">
          {deposits.length === 0 ? <EmptyState title="No deposits" body="Client deposit requests appear here after submission." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px]">
                <thead><tr><th className="th">Client</th><th className="th">Asset</th><th className="th text-right">Amount</th><th className="th">Status</th><th className="th text-right">Confirmations</th><th className="th">Tx hash</th><th className="th">Provider</th><th className="th">Created</th><th className="th"></th></tr></thead>
                <tbody>
                  {deposits.map((d) => (
                    <tr key={d.id} className="table-row">
                      <td className="td"><p className="text-white">{d.email}</p><p className="text-[10px] text-muted">{d.accountType}</p></td>
                      <td className="td text-[11.5px] text-white">{d.asset}<span className="ml-1 text-[10px] text-muted">{d.network}</span></td>
                      <td className="td text-right value-mono">{fmtMoney(d.creditedAmount ?? d.amount)}</td>
                      <td className="td"><StatusBadge status={d.status} /></td>
                      <td className="td text-right value-mono text-[11px] text-muted">{d.confirmations}/{d.requiredConfirmations}</td>
                      <td className="td max-w-[120px] truncate value-mono text-[10px] text-muted">{d.txHash ?? '—'}</td>
                      <td className="td text-[10.5px] text-muted">{d.provider ?? '—'}</td>
                      <td className="td text-[11px] text-muted">{relTime(d.createdAt)}</td>
                      <td className="td text-right">
                        {['PENDING', 'CONFIRMING'].includes(d.status) && (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setModal({ kind: 'credit', id: d.id, label: `Credit ${d.asset} deposit · ${d.email}` })} className="rounded-md border border-lime/30 bg-lime/10 px-2 py-1 text-[10px] font-medium text-lime">Credit</button>
                            <button onClick={() => setModal({ kind: 'rejectDeposit', id: d.id, label: `Reject deposit · ${d.email}` })} className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted hover:border-danger/40 hover:text-danger">Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'withdrawals' && (
        <div className="panel overflow-hidden">
          {withdrawals.length === 0 ? <EmptyState title="No withdrawals" body="Client withdrawal requests appear here for authorisation." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead><tr><th className="th">Client</th><th className="th text-right">Amount</th><th className="th text-right">Net</th><th className="th">Status</th><th className="th">KYC</th><th className="th">2FA</th><th className="th">Address</th><th className="th">Created</th><th className="th"></th></tr></thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="table-row">
                      <td className="td text-white">{w.email}</td>
                      <td className="td text-right value-mono">{fmtMoney(w.amount)}<span className="block text-[10px] text-muted">fee {fmtMoney(w.fee)}</span></td>
                      <td className="td text-right value-mono">{fmtMoney(w.netAmount)}</td>
                      <td className="td"><StatusBadge status={w.status} /></td>
                      <td className="td"><Badge tone={w.kycStatus === 'APPROVED' ? 'green' : 'amber'}>{w.kycStatus}</Badge></td>
                      <td className="td"><Badge tone={w.twoFactorVerified ? 'green' : 'gray'}>{w.twoFactorVerified ? 'verified' : 'n/a'}</Badge></td>
                      <td className="td max-w-[150px] truncate value-mono text-[10px] text-muted">{w.address}</td>
                      <td className="td text-[11px] text-muted">{relTime(w.createdAt)}</td>
                      <td className="td text-right">
                        <div className="flex justify-end gap-1">
                          {['PENDING', 'UNDER_REVIEW'].includes(w.status) && <button onClick={() => setModal({ kind: 'approve', id: w.id, label: `Approve withdrawal · ${w.email}` })} className="rounded-md border border-lime/30 bg-lime/10 px-2 py-1 text-[10px] font-medium text-lime">Approve</button>}
                          {w.status === 'APPROVED' && <button onClick={() => setModal({ kind: 'complete', id: w.id, label: `Mark completed · ${w.email}` })} className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-white hover:border-lime/40">Complete</button>}
                          {!['COMPLETED', 'REJECTED', 'FAILED'].includes(w.status) && <button onClick={() => setModal({ kind: 'rejectWithdrawal', id: w.id, label: `Reject withdrawal · ${w.email}` })} className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted hover:border-danger/40 hover:text-danger">Reject</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal ? modal.label.replace(/ · .*/, '') : ''}
        description={modal?.kind === 'complete' ? 'A transaction hash is required — the ledger settlement is recorded against it.' : modal?.kind === 'approve' ? 'Withdrawals without a configured custody provider move to APPROVED for manual payout.' : undefined}
        footer={<><button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className={modal?.kind.startsWith('reject') ? 'btn-danger' : 'btn-primary'} onClick={run}>Confirm</button></>}
      >
        <div className="space-y-2.5">
          {modal?.kind === 'credit' && <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Credit amount (blank = submitted amount)" className="field" />}
          {modal?.kind === 'complete' && <input value={form.txHash} onChange={(e) => setForm({ ...form, txHash: e.target.value })} placeholder="Blockchain / provider transaction hash" className="field font-mono text-[11.5px]" />}
          <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} placeholder="Internal note (visible to the client for rejections)" className="field resize-none" />
        </div>
      </Modal>
    </div>
  );
}
