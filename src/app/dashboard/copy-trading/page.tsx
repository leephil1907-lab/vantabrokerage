'use client';

import { useEffect, useState } from 'react';
import { Badge, EmptyState, apiFetch, useToast, Modal } from '@/components/ui';
import { fmtMoney, fmtPct } from '@/lib/format';

type Trader = { id: string; displayName: string; strategy: string; bio: string | null; verified: boolean; riskLevel: string; followerCount: number; verifiedTrades: number; verifiedPnl: number; winRate: number; metricsSource: string; following: { id: string; status: string; allocation: number; maxExposure: number } | null };

export default function CopyTradingPage() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [open, setOpen] = useState<Trader | null>(null);
  const [form, setForm] = useState({ allocation: '1000', maxExposure: '2500' });
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const load = () => apiFetch<{ traders: Trader[] }>('/api/copy/traders').then((b) => setTraders(b.traders)).catch(() => undefined);
  useEffect(() => { load(); }, []);

  const act = async (trader: Trader, action: 'follow' | 'pause' | 'stop') => {
    setBusy(true);
    try {
      await apiFetch('/api/copy/follow', {
        method: 'POST',
        body: JSON.stringify({ copyTraderId: trader.id, allocation: Number(form.allocation), maxExposure: Number(form.maxExposure), action }),
      });
      push({ tone: 'success', title: action === 'follow' ? 'Copy relationship active' : action === 'pause' ? 'Copying paused' : 'Copying stopped' });
      setOpen(null);
      load();
    } catch (e) { push({ tone: 'error', title: 'Action failed', body: (e as Error).message }); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Copy trading</h1>
        <p className="mt-0.5 text-[12px] text-muted">
          Strategies are listed with metrics computed from <strong className="text-white/80">verified execution records</strong> only — no self-reported performance.
        </p>
      </div>

      {traders.length === 0 ? (
        <div className="panel">
          <EmptyState
            title="No published strategies yet"
            body="Copy-trading listings appear once a trader is verified by the platform. Publisher onboarding is controlled by the risk desk, so this directory is intentionally empty on a fresh deployment."
          />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {traders.map((t) => (
            <div key={t.id} className="panel p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-white">
                    {t.displayName}
                    {t.verified && <Badge tone="lime">verified</Badge>}
                  </p>
                  <p className="text-[11px] text-muted">{t.strategy}</p>
                </div>
                <Badge tone={t.riskLevel === 'HIGH' ? 'red' : t.riskLevel === 'LOW' ? 'green' : 'amber'}>{t.riskLevel}</Badge>
              </div>
              {t.bio && <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{t.bio}</p>}
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-white/[0.07] bg-ink-900/60 py-1.5"><dt className="text-[9.5px] uppercase tracking-wide text-muted">30d ROI</dt><dd className={`value-mono text-[12px] ${t.verifiedPnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtMoney(t.verifiedPnl)}</dd></div>
                <div className="rounded-lg border border-white/[0.07] bg-ink-900/60 py-1.5"><dt className="text-[9.5px] uppercase tracking-wide text-muted">Win rate</dt><dd className="value-mono text-[12px] text-white">{fmtPct(t.winRate, 1)}</dd></div>
                <div className="rounded-lg border border-white/[0.07] bg-ink-900/60 py-1.5"><dt className="text-[9.5px] uppercase tracking-wide text-muted">Trades</dt><dd className="value-mono text-[12px] text-white">{t.verifiedTrades}</dd></div>
              </dl>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10.5px] text-muted">{t.followerCount} followers · {t.metricsSource}</span>
                {t.following ? (
                  <div className="flex gap-1.5">
                    <button onClick={() => act(t, t.following!.status === 'PAUSED' ? 'follow' : 'pause')} disabled={busy} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-muted hover:text-white">
                      {t.following.status === 'PAUSED' ? 'Resume' : 'Pause'}
                    </button>
                    <button onClick={() => act(t, 'stop')} disabled={busy} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-muted hover:border-danger/40 hover:text-danger">Stop</button>
                  </div>
                ) : (
                  <button onClick={() => { setOpen(t); setForm({ allocation: '1000', maxExposure: '2500' }); }} className="btn-primary px-3 py-1 text-[11px]">Copy</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={`Copy ${open?.displayName ?? ''}`}
        description="Allocation and maximum exposure are enforced server-side against your available balance."
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(null)} disabled={busy}>Cancel</button>
            <button className="btn-primary" onClick={() => open && act(open, 'follow')} disabled={busy || Number(form.maxExposure) > Number(form.allocation) * 3}>
              {busy ? 'Starting…' : 'Start copying'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block"><span className="label">Allocation (USD)</span><input value={form.allocation} onChange={(e) => setForm((f) => ({ ...f, allocation: e.target.value }))} inputMode="decimal" className="field mt-1.5" /></label>
          <label className="block"><span className="label">Maximum exposure (USD)</span><input value={form.maxExposure} onChange={(e) => setForm((f) => ({ ...f, maxExposure: e.target.value }))} inputMode="decimal" className="field mt-1.5" /></label>
          <p className="text-[10.5px] text-muted">Maximum exposure cannot exceed 3× your allocation.</p>
        </div>
      </Modal>
    </div>
  );
}
