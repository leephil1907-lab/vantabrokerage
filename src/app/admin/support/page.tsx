'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, EmptyState, StatusBadge, apiFetch, useToast } from '@/components/ui';
import { relTime } from '@/lib/format';

export default function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [status, setStatus] = useState('OPEN');
  const [active, setActive] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const { push } = useToast();

  const load = useCallback(() => apiFetch<{ tickets: any[] }>(`/api/admin/support?status=${status}`).then((b) => setTickets(b.tickets)).catch(() => undefined), [status]);
  useEffect(() => { load(); }, [load]);

  const send = async (ticketId: string, nextStatus?: string) => {
    try {
      await apiFetch(`/api/admin/support/${ticketId}`, { method: 'POST', body: JSON.stringify({ ...(reply ? { reply } : {}), ...(nextStatus ? { status: nextStatus } : {}) }) });
      push({ tone: 'success', title: 'Ticket updated' });
      setReply(''); load();
    } catch (e) { push({ tone: 'error', title: 'Update failed', body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Support desk</h1>
          <p className="mt-0.5 text-[12px] text-muted">Client tickets across account, deposit, withdrawal, trading and verification categories.</p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-sm w-44">
          {['OPEN', 'PENDING_CUSTOMER', 'RESOLVED', 'CLOSED', 'ALL'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className="panel"><EmptyState title="No tickets in this queue" body="New client tickets appear here." /></div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className="panel p-4">
              <div className="flex cursor-pointer flex-wrap items-start justify-between gap-3" onClick={() => setActive(active === t.id ? null : t.id)}>
                <div>
                  <p className="text-[12.5px] font-semibold text-white">{t.subject}</p>
                  <p className="text-[10.5px] text-muted">{t.email} · {t.category} · updated {relTime(t.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge tone={t.priority === 'URGENT' ? 'red' : t.priority === 'HIGH' ? 'amber' : 'gray'}>{t.priority}</Badge>
                  <StatusBadge status={t.status} />
                </div>
              </div>
              {active === t.id && (
                <div className="mt-3 space-y-2">
                  {t.messages.map((m: any) => (
                    <div key={m.id} className={`rounded-xl px-3 py-2 text-[11.5px] leading-relaxed ${m.isStaff ? 'border border-lime/20 bg-lime/[0.06] text-white/90' : 'border border-white/[0.07] bg-ink-900/60 text-white/80'}`}>
                      <p className="mb-1 text-[9.5px] uppercase tracking-wide text-muted">{m.isStaff ? 'Staff' : 'Client'} · {relTime(m.createdAt)}</p>
                      {m.body}
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to client…" className="field-sm flex-1" />
                    <button onClick={() => send(t.id)} disabled={!reply.trim()} className="btn-primary px-3 py-1.5 text-[11.5px]">Send reply</button>
                    <button onClick={() => send(t.id, 'RESOLVED')} className="btn-ghost px-3 py-1.5 text-[11.5px]">Resolve</button>
                    <button onClick={() => send(t.id, 'CLOSED')} className="btn-ghost px-3 py-1.5 text-[11.5px]">Close</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
