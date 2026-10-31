'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AssetMark } from '@/components/asset-mark';
import { useAccount } from '@/components/terminal/account-bar';
import { EmptyState, StatusBadge, apiFetch } from '@/components/ui';
import { fmtMoney, relTime } from '@/lib/format';

type Deposit = { id: string; asset: string; network: string | null; status: string; amount: number; creditedAmount: number | null; createdAt: string };
type DepositAddress = { asset: string; network: string; address: string; enabled: boolean; minConfirmations: number };
type Payload = { deposits: Deposit[]; addressBook: DepositAddress[] };
export default function DepositsPage() {
  const { accountId, active } = useAccount({ liveOnly: true });
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<'crypto' | 'bank'>('crypto');
  const [asset, setAsset] = useState('BTC');
  const [network, setNetwork] = useState('');
  const load = useCallback(async () => {
    if (!accountId) return;
    setError(null);
    try {
      const result = await apiFetch<Payload>(`/api/wallet/deposits?accountId=${accountId}`);
      setData(result);
      const available = result.addressBook.filter((entry) => entry.asset === asset);
      if (!available.some((entry) => entry.network === network)) setNetwork(available[0]?.network ?? '');
      if (!available.length && result.addressBook.length) setAsset(result.addressBook[0].asset);
    } catch { setError('We could not load your deposit details.'); }
  }, [accountId, asset, network]);
  useEffect(() => { load(); }, [load]);
  const assets = useMemo(() => Array.from(new Set(data?.addressBook.map((entry) => entry.asset) ?? [])), [data]);
  const networks = data?.addressBook.filter((entry) => entry.asset === asset) ?? [];
  const selected = networks.find((entry) => entry.network === network) ?? networks[0] ?? null;
  const copyAddress = async () => {
    if (!selected) return;
    try { await navigator.clipboard.writeText(selected.address); }
    catch { setError('Clipboard access was unavailable. You can select and copy the address manually.'); }
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-lime">Your assets / Funding</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Deposit funds</h1><p className="mt-2 text-sm text-muted">A clear view of your funding activity, all in one place.</p></div>
        <Link href="/dashboard/transactions" className="btn-ghost px-4 py-2.5 text-xs">View transactions <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <section className="panel overflow-hidden">
          <div className="border-b border-white/[.07] px-5 py-5 sm:px-7"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime/20 bg-lime/10 text-xl text-lime">↙</span><div><h2 className="text-base font-semibold text-white">Add funds</h2><p className="mt-1 text-xs text-muted">Choose a cryptocurrency and its exact network.</p></div></div></div>
          <div className="space-y-6 p-5 sm:p-7">
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/[.06] bg-black/20 p-1.5" role="tablist" aria-label="Funding method">
              {(['crypto', 'bank'] as const).map((m) => <button key={m} role="tab" aria-selected={method === m} onClick={() => setMethod(m)} className={`rounded-xl px-3 py-3 text-sm font-medium transition ${method === m ? 'bg-white/[.09] text-white shadow-sm' : 'text-muted hover:text-white'}`}>{m === 'crypto' ? '◈  Crypto' : '▤  Bank transfer'}</button>)}
            </div>
            {method === 'crypto' ? <div className="space-y-4">
              <div><label htmlFor="deposit-asset" className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Select an asset</label><div className="relative mt-2"><select id="deposit-asset" value={asset} onChange={(e) => { setAsset(e.target.value); setNetwork(''); }} className="field h-14 pl-12 text-sm font-medium">{assets.map((a) => <option key={a} value={a}>{a}</option>)}</select><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"><AssetMark symbol={`${asset}/USD`} size={26} /></span></div></div>
              <div><label htmlFor="deposit-network" className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Select network</label><select id="deposit-network" value={selected?.network ?? ''} onChange={(e) => setNetwork(e.target.value)} className="field mt-2 h-12 text-sm" disabled={!networks.length}>{networks.map((entry) => <option key={entry.network} value={entry.network}>{entry.network}</option>)}</select></div>
              {selected ? <div className="rounded-2xl border border-lime/20 bg-lime/[.04] p-4"><div className="flex items-center justify-between gap-3"><p className="text-[11px] font-semibold uppercase tracking-[.14em] text-lime">Shared deposit address</p><span className="rounded-full border border-lime/20 px-2 py-1 text-[9px] text-lime">Active</span></div><p className="mt-3 break-all rounded-lg border border-white/[.07] bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-white">{selected.address}</p><button onClick={copyAddress} className="mt-3 w-full rounded-lg border border-white/10 px-3 py-2.5 text-xs font-medium text-white transition hover:bg-white/[.06]">Copy deposit address</button><p className="mt-3 text-[11px] leading-relaxed text-muted">Send only {asset} using {selected.network}. Sending a different asset or using another network may result in permanent loss.</p></div> : <div className="rounded-xl border border-white/[.07] bg-black/20 p-4 text-xs text-muted">No active deposit address is configured for this asset.</div>}
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[.06] p-4"><div className="flex gap-3"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-400/30 text-amber-300">!</span><div><p className="text-sm font-semibold text-amber-200">Manual verification required</p><p className="mt-1 text-xs leading-relaxed text-white/55">These are shared wallet addresses. Automated blockchain detection is not connected. A transfer is not credited until PRIMEVEST finance independently verifies its transaction, asset, network and amount.</p></div></div></div>
            </div> : <div className="rounded-xl border border-white/[.07] bg-black/20 p-4"><p className="text-sm font-medium text-white">Bank transfer</p><p className="mt-2 text-xs leading-relaxed text-muted">Bank details will be shown only after an approved payment provider and account are in place.</p></div>}
          </div>
        </section>
        <div className="space-y-4">
          <section className="relative overflow-hidden rounded-2xl border border-lime/20 bg-[#101914] p-6"><div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-lime/10 blur-3xl" /><div className="relative"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-lime/80">Account overview</p><p className="mt-6 text-sm text-white/55">Available ledger balance</p><p className="value-mono mt-2 text-3xl font-semibold tracking-tight text-white">{active ? fmtMoney(active.available) : '—'}</p><div className="mt-6 flex items-center justify-between border-t border-white/[.08] pt-4 text-xs"><span className="text-muted">Account</span><span className="text-white">Live account</span></div><p className="mt-3 text-[11px] leading-relaxed text-white/45">Ledger figures are separate from unverified blockchain transfers.</p></div></section>
          <section className="panel p-6"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-muted">Before you deposit</p><h2 className="mt-3 text-lg font-semibold text-white">Check every detail.</h2><div className="mt-5 space-y-4">{[['01', 'Choose the asset', 'Select the exact cryptocurrency you intend to transfer.'], ['02', 'Match the network', 'The sending network must exactly match the selected deposit network.'], ['03', 'Keep your transaction ID', 'Save the transaction hash so finance can identify and verify the transfer.']].map(([n,title,body]) => <div key={n} className="flex gap-3"><span className="value-mono pt-0.5 text-[10px] text-lime/70">{n}</span><div><p className="text-xs font-medium text-white">{title}</p><p className="mt-1 text-[11px] leading-relaxed text-muted">{body}</p></div></div>)}</div></section>
        </div>
      </div>
      <section className="panel overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[.07] px-5 py-5 sm:px-7"><div><h2 className="text-base font-semibold text-white">Deposit history</h2><p className="mt-1 text-xs text-muted">Your recorded funding activity</p></div><button onClick={load} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-muted transition hover:text-white">Refresh</button></div>
        {error ? <p className="p-6 text-sm text-amber-300">{error}</p> : !data ? <p className="p-6 text-sm text-muted">Loading deposit history…</p> : !data.deposits.length ? <EmptyState title="No deposits yet" body="Verified deposit activity will appear here after finance review." /> : <div className="overflow-x-auto"><table className="w-full min-w-[620px]"><thead><tr><th className="th">Asset</th><th className="th">Network</th><th className="th text-right">Amount (USD equivalent)</th><th className="th">Status</th><th className="th">Created</th></tr></thead><tbody>{data.deposits.map(d => <tr key={d.id} className="table-row"><td className="td font-medium text-white">{d.asset}</td><td className="td text-muted">{d.network ?? '—'}</td><td className="td text-right value-mono">{fmtMoney(d.creditedAmount ?? d.amount)}</td><td className="td"><StatusBadge status={d.status} /></td><td className="td text-muted">{relTime(d.createdAt)}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
