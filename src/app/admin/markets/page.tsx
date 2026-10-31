'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, apiFetch, useToast } from '@/components/ui';
import { fmtPrice, relTime } from '@/lib/format';

type Market = { id: string; symbol: string; displayName: string; category: string; assetClass: string; enabled: boolean; maxLeverage: number; takerFee: number; payoutRate: number | null; dataSource: string; sourceSymbol: string | null; last: number | null; quoteSource: string | null; quoteAgeSeconds: number | null };

export default function AdminMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [providers, setProviders] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<Market | null>(null);
  const { push } = useToast();

  const load = useCallback(() => {
    apiFetch<{ markets: Market[]; providers: Record<string, string> }>('/api/admin/markets')
      .then((b) => { setMarkets(b.markets); setProviders(b.providers); })
      .catch(() => undefined);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    try {
      await apiFetch(`/api/admin/markets/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: editing.enabled, maxLeverage: editing.maxLeverage, takerFee: editing.takerFee, payoutRate: editing.payoutRate }),
      });
      push({ tone: 'success', title: 'Market updated', body: 'Configuration change recorded in the audit log.' });
      setEditing(null); load();
    } catch (e) { push({ tone: 'error', title: 'Update failed', body: (e as Error).message }); }
  };

  const rows = markets.filter((m) => !filter || m.symbol.toLowerCase().includes(filter.toLowerCase()) || m.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Market configuration</h1>
          <p className="mt-0.5 text-[12px] text-muted">Enable instruments, cap leverage, set fees and short-expiry payouts, and monitor data providers.</p>
        </div>
        <div className="flex gap-2">
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter symbol or category" className="field-sm w-52" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Object.entries(providers).map(([k, v]) => (
          <span key={k} className="chip">{k}: <span className={v === 'connected' ? 'text-emerald' : 'text-muted'}>{v}</span></span>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead><tr><th className="th">Symbol</th><th className="th">Category</th><th className="th">Enabled</th><th className="th text-right">Last</th><th className="th">Source</th><th className="th text-right">Age</th><th className="th text-right">Max lev.</th><th className="th text-right">Taker fee</th><th className="th text-right">Payout</th><th className="th"></th></tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="td"><p className="font-medium text-white">{m.symbol}</p><p className="text-[10px] text-muted">{m.sourceSymbol}</p></td>
                  <td className="td"><Badge tone="gray">{m.category}</Badge></td>
                  <td className="td"><Badge tone={m.enabled ? 'green' : 'red'}>{m.enabled ? 'live' : 'disabled'}</Badge></td>
                  <td className="td text-right value-mono">{fmtPrice(m.last)}</td>
                  <td className="td text-[11px] uppercase text-muted">{m.quoteSource ?? '—'}</td>
                  <td className={`td text-right value-mono text-[11px] ${m.quoteAgeSeconds && m.quoteAgeSeconds > 120 ? 'text-siren' : 'text-muted'}`}>{m.quoteAgeSeconds != null ? `${m.quoteAgeSeconds}s` : '—'}</td>
                  <td className="td text-right value-mono text-[11.5px]">{m.maxLeverage}×</td>
                  <td className="td text-right value-mono text-[11.5px]">{(m.takerFee * 100).toFixed(3)}%</td>
                  <td className="td text-right value-mono text-[11.5px]">{m.payoutRate ? `${(m.payoutRate * 100).toFixed(0)}%` : '—'}</td>
                  <td className="td text-right"><button onClick={() => setEditing(m)} className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted hover:text-white">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-950/80" onClick={() => setEditing(null)} />
          <div className="panel relative w-full max-w-md p-4">
            <p className="text-[13px] font-semibold text-white">{editing.symbol} configuration</p>
            <div className="mt-3 space-y-3">
              <label className="flex items-center justify-between text-[12px] text-muted">
                Trading enabled
                <input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} className="h-4 w-4 accent-lime" />
              </label>
              <label className="block"><span className="label">Max leverage</span><input value={editing.maxLeverage} onChange={(e) => setEditing({ ...editing, maxLeverage: Number(e.target.value) })} inputMode="numeric" className="field mt-1.5" /></label>
              <label className="block"><span className="label">Taker fee (decimal, e.g. 0.001 = 0.1%)</span><input value={editing.takerFee} onChange={(e) => setEditing({ ...editing, takerFee: Number(e.target.value) })} inputMode="decimal" className="field mt-1.5" /></label>
              {editing.category === 'BINARY' && (
                <label className="block"><span className="label">Payout rate (e.g. 0.85 = 85%)</span><input value={editing.payoutRate ?? ''} onChange={(e) => setEditing({ ...editing, payoutRate: Number(e.target.value) })} inputMode="decimal" className="field mt-1.5" /></label>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
              <button onClick={save} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
