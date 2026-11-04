'use client';

import { Select } from '@/components/ui/select';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AssetMark } from '@/components/asset-mark';
import { useAccount } from '@/components/terminal/account-bar';
import { EmptyState, StatusBadge, apiFetch, useToast } from '@/components/ui';
import { fmtMoney, relTime } from '@/lib/format';

type Deposit = { id: string; asset: string; network: string | null; status: string; amount: number; creditedAmount: number | null; txHash: string | null; createdAt: string };
type AddressConfig = { address: string; network: string; provider?: string; minConfirmations?: number };
type Payload = { deposits: Deposit[]; addressBook: Record<string, AddressConfig | null>; networks: Record<string, string[]>; cardProviderConfigured: boolean };

export default function DepositsPage() {
  const { accountId, active } = useAccount({ liveOnly: true });
  const { push } = useToast();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
    const [asset, setAsset] = useState('');
  const [network, setNetwork] = useState('');
  const [amountUsd, setAmountUsd] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!accountId) return;
    setError(null);
    try { setData(await apiFetch<Payload>(`/api/wallet/deposits?accountId=${accountId}`)); }
    catch { setError('We could not load your deposit history.'); }
  }, [accountId]);
  useEffect(() => { load(); }, [load]);

  const configured = useMemo(() => {
    const book = data?.addressBook ?? {};
    const entries = Object.entries(book).filter(([, v]) => v && typeof v.address === 'string' && v.address.length > 8) as [string, AddressConfig][];
    const assets = [...new Set(entries.map(([k]) => k.split(':')[0]))];
    return { entries, assets };
  }, [data]);

  useEffect(() => {
    if (!configured.assets.length) return;
    if (!configured.assets.includes(asset)) setAsset(configured.assets[0]);
  }, [configured.assets, asset]);

  const networkOptions = useMemo(() => {
    if (!asset || !data) return [];
    const allowed = data.networks?.[asset] ?? [];
    return configured.entries.filter(([k]) => k.split(':')[0] === asset && (allowed.length === 0 || allowed.includes(k.split(':')[1])));
  }, [asset, data, configured.entries]);

  useEffect(() => {
    const keys = networkOptions.map(([k]) => k);
    if (!keys.includes(`${asset}:${network}`)) setNetwork(keys[0]?.split(':')[1] ?? '');
  }, [networkOptions, asset, network]);

  const current = networkOptions.find(([k]) => k === `${asset}:${network}`)?.[1] ?? null;

  const copy = async () => {
    if (!current) return;
    try { await navigator.clipboard.writeText(current.address); setCopied(true); setTimeout(() => setCopied(false), 1600); push({ title: 'Address copied', tone: 'success' }); }
    catch { push({ title: 'Copy unavailable', body: 'Select the address text manually.', tone: 'error' }); }
  };

  const submit = async () => {
    if (!accountId || !current) return;
    setSubmitError(null);
    const usd = Number(amountUsd);
    if (!Number.isFinite(usd) || usd <= 0) { setSubmitError('Enter the USD equivalent of your deposit.'); return; }
    if (txHash.trim().length < 8) { setSubmitError('Enter the transaction hash of your on-chain transfer.'); return; }
    setSubmitting(true);
    try {
      await apiFetch('/api/wallet/deposits', {
        method: 'POST',
        body: JSON.stringify({ accountId, asset, network, amountUsd: usd, cryptoAmount: cryptoAmount.trim() || undefined, txHash: txHash.trim() }),
      });
      setTxHash(''); setAmountUsd(''); setCryptoAmount('');
      push({ title: 'Deposit submitted', body: 'Awaiting finance review — no funds credited yet.', tone: 'success' });
      await load();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'We could not submit your deposit.');
    } finally { setSubmitting(false); }
  };

  const fundingLive = configured.assets.length > 0;

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-lime">Your assets / Funding</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Deposit funds</h1><p className="mt-2 text-sm text-muted">A clear view of your funding activity, all in one place.</p></div>
        <Link href="/dashboard/transactions" className="btn-ghost px-4 py-2.5 text-xs">View transactions <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <section className="panel">
          <div className="rounded-t-2xl border-b border-white/[.07] px-5 py-5 sm:px-7"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime/20 bg-lime/10 text-xl text-lime">↙</span><div><h2 className="text-base font-semibold text-white">Add funds</h2><p className="mt-1 text-xs text-muted">{fundingLive ? 'Send on-chain, submit your transaction hash, and finance verifies and credits it.' : 'Choose a funding method to see its availability.'}</p></div></div></div>
          <div className="space-y-6 p-5 sm:p-7">
            <div className="rounded-2xl border border-white/[.06] bg-black/20 px-4 py-3"><p className="text-sm font-medium text-white">◈  Crypto transfer</p><p className="mt-1 text-[11px] text-muted">On-chain funding with finance verification on every credit.</p></div>
            {!fundingLive ? (
              <>
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[.06] p-4"><div className="flex gap-3"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-400/30 text-amber-300">!</span><div><p className="text-sm font-semibold text-amber-200">Funding coming soon</p><p className="mt-1 text-xs leading-relaxed text-white/55">Deposit options will appear here once funding is enabled.</p></div></div></div>
                <button disabled className="w-full cursor-not-allowed rounded-xl bg-white/[.07] px-4 py-3.5 text-sm font-semibold text-white/35">Deposits opening soon</button>
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select label="Select an asset" value={asset} onChange={(v) => setAsset(v)} options={configured.assets.map((a) => ({ value: a, label: a, icon: <AssetMark symbol={`${a}/USD`} size={22} /> }))} leading={<AssetMark symbol={`${asset}/USD`} size={26} />} buttonClassName="h-14" />
                  <Select label="Network" value={network} onChange={(v) => setNetwork(v)} options={networkOptions.map(([k, c]) => ({ value: k.split(':')[1], label: c.network }))} buttonClassName="h-14" />
                </div>
                {current && (
                  <div className="rounded-2xl border border-white/[.08] bg-black/25 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-muted">Receive address · {current.network}</p>
                      <button onClick={copy} className="rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] font-semibold text-white/80 transition hover:border-lime/40 hover:text-lime">{copied ? 'Copied ✓' : 'Copy'}</button>
                    </div>
                    <p className="value-mono mt-2 break-all text-[13px] text-white">{current.address}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">Send only {asset} on {current.network} to this address. {current.minConfirmations ? `Credits require ${current.minConfirmations} network confirmations and finance verification.` : 'Credits follow finance verification.'}</p>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-muted">USD equivalent *</span><input inputMode="decimal" value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} placeholder="500.00" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 font-mono text-sm text-white outline-none transition focus:border-lime/50" /></label>
                  <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Amount sent ({asset})</span><input inputMode="decimal" value={cryptoAmount} onChange={(e) => setCryptoAmount(e.target.value)} placeholder="optional" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 font-mono text-sm text-white outline-none transition focus:border-lime/50" /></label>
                </div>
                <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Transaction hash *</span><input value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="Paste the on-chain tx hash of your transfer" className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 font-mono text-[12.5px] text-white outline-none transition focus:border-lime/50" /></label>
                {submitError && <p className="rounded-xl border border-siren/30 bg-siren/10 px-3.5 py-2.5 text-[12px] text-amber-200">{submitError}</p>}
                <button onClick={submit} disabled={submitting || !current} className="btn-primary w-full px-4 py-3.5 text-sm">{submitting ? 'Submitting…' : 'Submit deposit for review'}</button>
                <p className="text-[11px] leading-relaxed text-muted">Submitted deposits stay pending until the finance team independently verifies the transaction on-chain and credits your live account. A submitted hash alone never credits funds.</p>
              </>
            )}
          </div>
        </section>
        <div className="space-y-4">
          <section className="relative overflow-hidden rounded-2xl border border-lime/20 bg-ink-850 p-6"><div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-lime/10 blur-3xl" /><div className="relative"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-lime/80">Account overview</p><p className="mt-6 text-sm text-white/55">Available ledger balance</p><p className="value-mono mt-2 text-3xl font-semibold tracking-tight text-white">{active ? fmtMoney(active.available) : '—'}</p><div className="mt-6 flex items-center justify-between border-t border-white/[.08] pt-4 text-xs"><span className="text-muted">Account</span><span className="text-white">Live account</span></div></div></section>
          <section className="panel p-6"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-muted">How deposits work</p><h2 className="mt-3 text-lg font-semibold text-white">Three steps, fully tracked.</h2><div className="mt-5 space-y-4">{[['01', 'Send on-chain', fundingLive ? 'Transfer your asset to the receive address shown for your chosen network.' : 'Receive addresses appear once funding is configured for your region.'], ['02', 'Submit the hash', 'Paste the transaction hash and the USD equivalent so finance can match your transfer.'], ['03', 'Verification & credit', 'Finance verifies destination, asset, amount and finality, then credits your live account once.']].map(([n, title, body]) => <div key={n} className="flex gap-3"><span className="value-mono pt-0.5 text-[10px] text-lime/70">{n}</span><div><p className="text-xs font-medium text-white">{title}</p><p className="mt-1 text-[11px] leading-relaxed text-muted">{body}</p></div></div>)}</div></section>
        </div>
      </div>
      <section className="panel overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[.07] px-5 py-5 sm:px-7"><div><h2 className="text-base font-semibold text-white">Deposit history</h2><p className="mt-1 text-xs text-muted">Your recorded funding activity</p></div><button onClick={load} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-muted transition hover:text-white">Refresh</button></div>
        {error ? <p className="p-6 text-sm text-amber-300">{error}</p> : !data ? <p className="p-6 text-sm text-muted">Loading deposit history…</p> : !data.deposits.length ? <EmptyState title="No deposits yet" body={fundingLive ? 'Your submitted deposits and their review status will appear here.' : 'Your deposit history will appear here when funding is available.'} /> : <div className="overflow-x-auto"><table className="w-full min-w-[680px]"><thead><tr><th className="th">Asset</th><th className="th">Network</th><th className="th text-right">Amount (USD equivalent)</th><th className="th">Status</th><th className="th">Tx hash</th><th className="th">Created</th></tr></thead><tbody>{data.deposits.map(d => <tr key={d.id} className="table-row"><td className="td font-medium text-white"><span className="flex items-center gap-2"><AssetMark symbol={`${d.asset}/USD`} size={18} />{d.asset}</span></td><td className="td text-muted">{d.network ?? '—'}</td><td className="td text-right value-mono">{fmtMoney(d.creditedAmount ?? d.amount)}</td><td className="td"><StatusBadge status={d.status} /></td><td className="td value-mono text-muted">{d.txHash ? `${d.txHash.slice(0, 10)}…` : '—'}</td><td className="td text-muted">{relTime(d.createdAt)}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
