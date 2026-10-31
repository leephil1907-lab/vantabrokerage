'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AccountSwitcher, useAccount } from '@/components/terminal/account-bar';
import { Badge, EmptyState, StatusBadge, apiFetch, useToast } from '@/components/ui';
import { fmtMoney, relTime } from '@/lib/format';

type Withdrawal = { id: string; status: string; asset: string; network: string; address: string; amount: number; fee: number; netAmount: number; txHash: string | null; reviewNote: string | null; createdAt: string };

export default function WithdrawalsPage() {
  const { accounts, accountId, select, active, liveEnabled } = useAccount();
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [form, setForm] = useState({ asset: 'USDT', network: 'TRC20', address: '', amount: '', password: '', totp: '' });
  const [busy, setBusy] = useState(false);
  const [kycStatus, setKycStatus] = useState('NOT_SUBMITTED');
  const { push } = useToast();

  const load = useCallback(async () => {
    if (!accountId) return;
    const [w, k] = await Promise.all([
      apiFetch<{ withdrawals: Withdrawal[] }>(`/api/wallet/withdrawals?accountId=${accountId}`).catch(() => null),
      apiFetch<{ kyc: { status: string } }>('/api/kyc').catch(() => null),
    ]);
    if (w) setItems(w.withdrawals);
    if (k) setKycStatus(k.kyc.status);
  }, [accountId]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await apiFetch<{ withdrawal: { id: string; amount: number; netAmount: number }; note: string }>('/api/wallet/withdrawals', {
        method: 'POST',
        body: JSON.stringify({ accountId, asset: form.asset, network: form.network, address: form.address, amount: Number(form.amount), password: form.password, ...(form.totp ? { totp: form.totp } : {}) }),
      });
      push({ tone: 'success', title: 'Withdrawal requested', body: `${fmtMoney(res.withdrawal.amount)} reserved · net ${fmtMoney(res.withdrawal.netAmount)}. ${res.note}` });
      setForm((f) => ({ ...f, amount: '', address: '', password: '', totp: '' }));
      load();
    } catch (e) { push({ tone: 'error', title: 'Withdrawal rejected', body: (e as Error).message }); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Withdrawals</h1>
          <p className="mt-0.5 text-[12px] text-muted">Requests require password re-authentication, then finance review before payout.</p>
        </div>
        <AccountSwitcher accounts={accounts} accountId={accountId} onSelect={select} active={active} liveEnabled={liveEnabled} />
      </div>

      {kycStatus !== 'APPROVED' && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-siren/25 bg-siren/[0.07] px-4 py-2.5">
          <p className="text-[11.5px] text-siren">Identity verification must be approved before withdrawals can be requested.</p>
          <Link href="/dashboard/verification" className="btn-ghost px-3 py-1 text-[11.5px]">Verify now</Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <section className="panel p-4">
          <p className="text-[13px] font-semibold text-white">Request a withdrawal</p>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="label">Asset</span>
                <select value={form.asset} onChange={(e) => setForm((f) => ({ ...f, asset: e.target.value }))} className="field mt-1.5">
                  {['USDT', 'USDC', 'BTC', 'ETH', 'LTC'].map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">Network</span>
                <select value={form.network} onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))} className="field mt-1.5">
                  {['TRC20', 'ERC20', 'BEP20', 'Bitcoin', 'Solana'].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="label">Destination address</span>
              <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="field mt-1.5 font-mono text-[11.5px]" placeholder="Paste your wallet address" />
            </label>
            <label className="block">
              <span className="label">Amount (USD equivalent)</span>
              <input value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} inputMode="decimal" className="field mt-1.5" placeholder="0.00" />
              <span className="mt-1 block text-[10.5px] text-muted">Minimum 20.00 · fee 0.5% (min 1.00) · daily limit applies</span>
            </label>
            <label className="block">
              <span className="label">Account password</span>
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="field mt-1.5" placeholder="Re-authenticate" />
            </label>
            <label className="block">
              <span className="label">Authenticator code (if enabled)</span>
              <input value={form.totp} onChange={(e) => setForm((f) => ({ ...f, totp: e.target.value }))} inputMode="numeric" maxLength={6} className="field mt-1.5" placeholder="123456" />
            </label>
            <button onClick={submit} disabled={busy || !form.address || !form.amount || !form.password || active?.type !== 'LIVE'} className="btn-primary w-full py-2 text-[12.5px]">
              {busy ? 'Submitting…' : 'Request withdrawal'}
            </button>
            <p className="text-[10.5px] leading-relaxed text-muted">
              Funds are reserved from your available balance immediately. If finance rejects the request, the reservation is released back automatically.
            </p>
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-[13px] font-semibold text-white">Withdrawal history</p></div>
          {!items.length ? <EmptyState title="No withdrawals yet" body="Submitted requests appear here with review status and transaction hashes." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead><tr><th className="th">Asset</th><th className="th text-right">Amount</th><th className="th text-right">Net</th><th className="th">Status</th><th className="th">Address</th><th className="th">Tx</th><th className="th">Created</th></tr></thead>
                <tbody>
                  {items.map((w) => (
                    <tr key={w.id} className="table-row">
                      <td className="td font-medium text-white">{w.asset}<span className="ml-1 text-[10px] text-muted">{w.network}</span></td>
                      <td className="td text-right value-mono">{fmtMoney(w.amount)}</td>
                      <td className="td text-right value-mono">{fmtMoney(w.netAmount)}</td>
                      <td className="td"><StatusBadge status={w.status} /></td>
                      <td className="td max-w-[140px] truncate value-mono text-[10.5px] text-muted">{w.address}</td>
                      <td className="td max-w-[100px] truncate value-mono text-[10px] text-muted">{w.txHash ?? '—'}</td>
                      <td className="td text-[11px] text-muted">{relTime(w.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
