'use client';

import { useCallback, useEffect, useState } from 'react';
import { AccountSwitcher, useAccount } from '@/components/terminal/account-bar';
import { Badge, EmptyState, StatusBadge, apiFetch, useToast } from '@/components/ui';
import { fmtMoney, relTime } from '@/lib/format';

type Deposit = { id: string; method: string; status: string; asset: string; network: string | null; address: string | null; txHash: string | null; amount: number; creditedAmount: number | null; confirmations: number; requiredConfirmations: number; createdAt: string; creditedAt: string | null; metadata: Record<string, unknown> };
type AddressBook = Record<string, { address: string; network: string; provider?: string } | null>;
type Payload = { deposits: Deposit[]; addressBook: AddressBook; cardProviderConfigured: boolean };

const ASSETS = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'TRX', 'LTC'];

export default function DepositsPage() {
  const { accounts, accountId, select, active, liveEnabled } = useAccount();
  const [data, setData] = useState<Payload | null>(null);
  const [form, setForm] = useState({ asset: 'BTC', amount: '', txHash: '', network: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ verification?: { verifiable: boolean; verified: boolean; confirmations: number; reason?: string }; deposit?: { address?: string; network?: string; status?: string } } | null>(null);
  const { push } = useToast();

  const load = useCallback(async () => {
    if (!accountId) return;
    try { setData(await apiFetch<Payload>(`/api/wallet/deposits?accountId=${accountId}`)); } catch { /* noop */ }
  }, [accountId]);

  useEffect(() => { load(); }, [load]);

  const address = data?.addressBook?.[form.asset];

  const submit = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await apiFetch<any>('/api/wallet/deposits', {
        method: 'POST',
        body: JSON.stringify({
          accountId,
          asset: form.asset,
          amount: Number(form.amount),
          ...(form.txHash.trim() ? { txHash: form.txHash.trim() } : {}),
          ...(form.network.trim() ? { network: form.network.trim() } : {}),
        }),
      });
      setResult(res);
      push({
        tone: 'success',
        title: form.txHash ? 'Deposit submitted for verification' : 'Deposit address issued',
        body: form.txHash ? 'Automated verification is unavailable. Finance must independently review the transaction.' : 'Send funds to the address shown and submit the transaction hash.',
      });
      setForm((f) => ({ ...f, amount: '', txHash: '' }));
      load();
    } catch (e) {
      push({ tone: 'error', title: 'Deposit request failed', body: (e as Error).message });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Deposits</h1>
          <p className="mt-0.5 text-[12px] text-muted">Automated on-chain verification is not connected. Submitted deposits require independent finance review.</p>
        </div>
        <AccountSwitcher accounts={accounts} accountId={accountId} onSelect={select} active={active} liveEnabled={liveEnabled} />
      </div>

      {active?.type === 'PAPER' && (
        <div className="rounded-xl border border-sky-400/25 bg-sky-400/10 px-4 py-2.5 text-[11.5px] text-sky-300">
          Deposits are only accepted into your <strong>live</strong> account. Switch accounts to fund it.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <section className="panel p-4">
          <p className="text-[13px] font-semibold text-white">New crypto deposit</p>
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="label">Asset</span>
              <select value={form.asset} onChange={(e) => { setForm((f) => ({ ...f, asset: e.target.value })); setResult(null); }} className="field mt-1.5">
                {ASSETS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <div className="rounded-xl border border-white/[0.07] bg-ink-900/60 p-3">
              <p className="text-[10.5px] uppercase tracking-wide text-muted">Deposit address ({address?.network ?? 'not configured'})</p>
              {address ? (
                <p className="value-mono mt-1 break-all text-[11.5px] text-white">{address.address}</p>
              ) : (
                <p className="mt-1 text-[11px] leading-relaxed text-siren">
                  No custody provider is configured for {form.asset} on this deployment. You can still record a deposit you have already sent — it will be queued for manual finance review.
                </p>
              )}
            </div>
            <label className="block">
              <span className="label">Amount (USD equivalent)</span>
              <input value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} inputMode="decimal" placeholder="0.00" className="field mt-1.5" />
            </label>
            <label className="block">
              <span className="label">Transaction hash (after you send)</span>
              <input value={form.txHash} onChange={(e) => setForm((f) => ({ ...f, txHash: e.target.value }))} placeholder="0x… / bitcoin txid" className="field mt-1.5 font-mono text-[11.5px]" />
            </label>
            <label className="block">
              <span className="label">Network (optional)</span>
              <input value={form.network} onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))} placeholder={address?.network ?? 'ERC20 / TRC20 / Bitcoin'} className="field mt-1.5" />
            </label>
            <button onClick={submit} disabled={busy || !Number(form.amount) || active?.type !== 'LIVE'} className="btn-primary w-full py-2 text-[12.5px]">
              {busy ? 'Submitting…' : form.txHash ? 'Submit transaction for verification' : 'Get deposit address'}
            </button>
            {!data?.cardProviderConfigured && (
              <p className="text-[10.5px] leading-relaxed text-muted">Card and bank transfer rails are unavailable until a payment provider is configured for this deployment.</p>
            )}
          </div>

          {result?.verification && (
            <div className="mt-3 rounded-xl border border-white/10 bg-ink-900/60 p-3 text-[11px]">
              <p className="font-semibold text-white">On-chain verification</p>
              <p className="mt-1 text-muted">
                {result.verification.verifiable
                  ? result.verification.verified
                    ? `Confirmed · ${result.verification.confirmations} confirmations. Queued for credit.`
                    : result.verification.reason ?? `Waiting for confirmations (${result.verification.confirmations}).`
                  : result.verification.reason}
              </p>
            </div>
          )}
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-[13px] font-semibold text-white">Deposit history</p></div>
          {!data?.deposits.length ? <EmptyState title="No deposits yet" body="Submitted deposits appear here with verification status and confirmations." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead><tr><th className="th">Asset</th><th className="th">Network</th><th className="th text-right">Amount</th><th className="th">Status</th><th className="th text-right">Conf.</th><th className="th">Created</th></tr></thead>
                <tbody>
                  {data.deposits.map((d) => (
                    <tr key={d.id} className="table-row">
                      <td className="td font-medium text-white">{d.asset}</td>
                      <td className="td text-[11px] text-muted">{d.network ?? '—'}</td>
                      <td className="td text-right value-mono">{fmtMoney(d.creditedAmount ?? d.amount)}</td>
                      <td className="td"><StatusBadge status={d.status} /></td>
                      <td className="td text-right value-mono text-[11px] text-muted">{d.confirmations}/{d.requiredConfirmations}</td>
                      <td className="td text-[11px] text-muted">{relTime(d.createdAt)}</td>
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
