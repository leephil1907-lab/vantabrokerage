'use client';
import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/select';
import { apiFetch, Badge, useToast, EmptyState } from '@/components/ui';
import { fmtPrice, priceDp, relTime } from '@/lib/format';

type Alert = { id: string; symbol: string; direction: 'ABOVE' | 'BELOW'; threshold: number; triggered: boolean; triggeredAt: string | null; createdAt: string };

export function PriceAlerts({ symbols }: { symbols: string[] }) {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [symbol, setSymbol] = useState(symbols[0] ?? '');
  const [direction, setDirection] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [threshold, setThreshold] = useState('');
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const load = async () => {
    try { const r = await apiFetch<{ alerts: Alert[] }>('/api/alerts'); setAlerts(r.alerts); } catch { setAlerts([]); }
  };
  useEffect(() => { void load(); const t = setInterval(load, 15_000); return () => clearInterval(t); }, []);

  const create = async () => {
    const value = Number(threshold);
    if (!symbol || !Number.isFinite(value) || value <= 0) return push({ tone: 'error', title: 'Invalid alert', body: 'Pick a market and enter a target price above zero.' });
    setBusy(true);
    try {
      await apiFetch('/api/alerts', { method: 'POST', body: JSON.stringify({ symbol, direction, threshold: value }) });
      setThreshold(''); push({ tone: 'success', title: 'Alert created', body: `We'll notify you when ${symbol} crosses ${value}.` });
      await load();
    } catch (e) { push({ tone: 'error', title: 'Could not create alert', body: (e as Error).message }); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    try { await apiFetch(`/api/alerts/${id}`, { method: 'DELETE' }); await load(); } catch (e) { push({ tone: 'error', title: 'Could not remove alert', body: (e as Error).message }); }
  };

  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-[15px] font-semibold text-white">Price alerts</h2><p className="text-[11px] text-muted">Get notified the moment a market crosses your level</p></div>
        <Badge tone="lime">{alerts?.filter((a) => !a.triggered).length ?? 0} active</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <label className="sr-only" htmlFor="alert-symbol">Market</label>
        <Select id="alert-symbol" value={symbol} onChange={setSymbol} options={symbols.map((sym) => ({ value: sym, label: sym }))} buttonClassName="h-10 text-[12px]" />
        <label className="sr-only" htmlFor="alert-dir">Direction</label>
        <Select id="alert-dir" value={direction} onChange={(v) => setDirection(v as 'ABOVE' | 'BELOW')} options={[{ value: 'ABOVE', label: 'Rises above' }, { value: 'BELOW', label: 'Falls below' }]} buttonClassName="h-10 text-[12px]" />
        <label className="sr-only" htmlFor="alert-threshold">Target price</label>
        <input id="alert-threshold" inputMode="decimal" placeholder="Target price" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 font-mono text-[12px] text-white outline-none focus:border-lime/60" />
        <button onClick={create} disabled={busy} className="btn-primary px-4 py-2 text-[12px] disabled:opacity-60">{busy ? 'Saving…' : 'Create alert'}</button>
      </div>
      <div className="mt-3 space-y-2">
        {!alerts ? <p className="py-4 text-center text-[11.5px] text-muted">Loading alerts…</p>
          : alerts.length === 0 ? <EmptyState title="No alerts yet" body="Create an alert above and the market worker will watch the level for you." />
          : alerts.slice(0, 8).map((a) => (
            <div key={a.id} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${a.triggered ? 'border-emerald/30 bg-emerald/[0.06]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-white">{a.symbol}
                  <Badge tone={a.direction === 'ABOVE' ? 'green' : 'amber'}>{a.direction === 'ABOVE' ? '≥ above' : '≤ below'} {fmtPrice(a.threshold, priceDp(a.symbol))}</Badge>
                  {a.triggered && <Badge tone="green">triggered {relTime(a.triggeredAt)}</Badge>}
                </p>
                <p className="mt-0.5 text-[10.5px] text-muted">created {relTime(a.createdAt)}</p>
              </div>
              <button onClick={() => remove(a.id)} className="text-[10.5px] font-semibold text-danger hover:underline">Remove</button>
            </div>
          ))}
      </div>
    </section>
  );
}
