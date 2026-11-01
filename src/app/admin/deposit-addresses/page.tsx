'use client';

import { useEffect, useState } from 'react';
import { apiFetch, useToast } from '@/components/ui';

type Address = { asset: string; network: string; address: string; enabled: boolean; minConfirmations: number };
const EMPTY: Address = { asset: '', network: '', address: '', enabled: true, minConfirmations: 3 };

export default function AdminDepositAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [draft, setDraft] = useState<Address>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();
  const load = async () => {
    setLoading(true);
    try { const result = await apiFetch<{ addresses: Address[] }>('/api/admin/deposit-addresses'); setAddresses(result.addresses); }
    catch (e) { push({ tone: 'error', title: 'Could not load addresses', body: (e as Error).message }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const save = async (next: Address[]) => {
    setBusy(true);
    try { const result = await apiFetch<{ addresses: Address[] }>('/api/admin/deposit-addresses', { method: 'PUT', body: JSON.stringify({ addresses: next }) }); setAddresses(result.addresses); push({ tone: 'success', title: 'Deposit addresses saved', body: 'The customer deposit page now uses this address book.' }); }
    catch (e) { push({ tone: 'error', title: 'Save failed', body: (e as Error).message }); }
    finally { setBusy(false); }
  };
  const add = async () => {
    const item = { ...draft, asset: draft.asset.trim().toUpperCase(), network: draft.network.trim(), address: draft.address.trim() };
    if (!item.asset || !item.network || !item.address) { push({ tone: 'error', title: 'Complete all fields', body: 'Asset, network and wallet address are required.' }); return; }
    await save([...addresses, item]); setDraft(EMPTY);
  };
  const update = (index: number, patch: Partial<Address>) => setAddresses((old) => old.map((item, i) => i === index ? { ...item, ...patch } : item));
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-xl font-semibold tracking-tight text-white">Crypto deposit addresses</h1><p className="mt-1 text-[12px] text-muted">Manage the shared wallet addresses shown to customers. Changes are recorded in the admin audit log.</p></div><button onClick={() => save(addresses)} disabled={busy || loading} className="btn-primary px-4 py-2 text-[12px]">{busy ? 'Saving…' : 'Save changes'}</button></div>
    <section className="panel p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-[13px] font-semibold text-white">Configured wallets</h2><span className="text-[10px] text-muted">{addresses.filter((a) => a.enabled).length} active · {addresses.length} total</span></div>
      {loading ? <p className="py-6 text-[12px] text-muted">Loading address book…</p> : <div className="mt-3 space-y-3">{addresses.map((item, index) => <div key={item.asset + item.network} className="grid gap-2 rounded-xl border border-white/[.07] bg-black/20 p-3 md:grid-cols-[90px_150px_minmax(0,1fr)_100px_110px]"><div><label className="label">Asset</label><input value={item.asset} onChange={(e) => update(index, { asset: e.target.value.toUpperCase() })} className="field-sm mt-1 w-full" /></div><div><label className="label">Network</label><input value={item.network} onChange={(e) => update(index, { network: e.target.value })} className="field-sm mt-1 w-full" /></div><div><label className="label">Deposit address</label><input value={item.address} onChange={(e) => update(index, { address: e.target.value })} className="field-sm mt-1 w-full font-mono text-[10px]" /></div><div><label className="label">Confirmations</label><input type="number" min="1" max="500" value={item.minConfirmations} onChange={(e) => update(index, { minConfirmations: Number(e.target.value) })} className="field-sm mt-1 w-full" /></div><label className="flex items-center gap-2 self-end pb-2 text-[11px] text-muted"><input type="checkbox" checked={item.enabled} onChange={(e) => update(index, { enabled: e.target.checked })} /> Active</label><div className="md:col-span-5 flex justify-end"><button onClick={() => save(addresses.filter((_, i) => i !== index))} disabled={busy} className="text-[10px] text-danger hover:underline">Remove entry</button></div></div>)}</div>}
    </section>
    <section className="panel p-4"><h2 className="text-[13px] font-semibold text-white">Add another wallet</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[100px_180px_minmax(0,1fr)_120px_auto]"><div><label className="label">Asset</label><input value={draft.asset} onChange={(e) => setDraft({ ...draft, asset: e.target.value.toUpperCase() })} placeholder="e.g. BTC" className="field-sm mt-1 w-full" /></div><div><label className="label">Network</label><input value={draft.network} onChange={(e) => setDraft({ ...draft, network: e.target.value })} placeholder="e.g. Bitcoin" className="field-sm mt-1 w-full" /></div><div><label className="label">Wallet address</label><input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Paste shared deposit address" className="field-sm mt-1 w-full font-mono text-[10px]" /></div><div><label className="label">Confirmations</label><input type="number" min="1" max="500" value={draft.minConfirmations} onChange={(e) => setDraft({ ...draft, minConfirmations: Number(e.target.value) })} className="field-sm mt-1 w-full" /></div><button onClick={add} disabled={busy} className="btn-primary self-end px-4 py-2 text-[11px]">Add wallet</button></div>
      <p className="mt-3 text-[10.5px] leading-relaxed text-muted">Only add addresses controlled by PRIMEVEST. Shared addresses require finance to match each submitted transaction to the correct customer; address display alone never verifies or credits a deposit.</p>
    </section>
  </div>;
}
