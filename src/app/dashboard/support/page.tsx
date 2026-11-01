'use client';

import { useEffect, useState } from 'react';
import { Badge, EmptyState, StatusBadge, apiFetch, useToast, Modal } from '@/components/ui';
import { relTime } from '@/lib/format';

type Ticket = { id: string; subject: string; category: string; priority: string; status: string; createdAt: string; updatedAt: string; messages: { id: string; body: string; isStaff: boolean; attachments: unknown; createdAt: string }[] };

const FAQS = [
  ['How do I verify my account?', 'Open Verification in your dashboard, submit your identity details and two document images. Review times vary.'],
  ['Why is my withdrawal pending?', 'Withdrawals require identity approval, then finance review. Funds are reserved immediately; rejection releases them automatically.'],
  ['Can I place an order?', 'Yes — place demo or live orders from the trading terminal.'],
  ['Where do prices come from?', 'Kraken and Coinbase for crypto, Yahoo Finance for FX, indices and commodities. Each quote records its provider and timestamp.'],
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'ACCOUNT', priority: 'NORMAL', message: '' });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const load = () => apiFetch<{ tickets: Ticket[] }>('/api/support/tickets').then((b) => setTickets(b.tickets)).catch(() => undefined);
  useEffect(() => { load(); const id = setInterval(load, 20_000); return () => clearInterval(id); }, []);

  const submit = async () => {
    setBusy(true);
    try {
      await apiFetch('/api/support/tickets', { method: 'POST', body: JSON.stringify(form) });
      push({ tone: 'success', title: 'Ticket created', body: 'Our team will reply in your dashboard and by email.' });
      setOpenNew(false);
      setForm({ subject: '', category: 'ACCOUNT', priority: 'NORMAL', message: '' });
      load();
    } catch (e) { push({ tone: 'error', title: 'Could not create ticket', body: (e as Error).message }); }
    finally { setBusy(false); }
  };

  const sendReply = async (id: string) => {
    try {
      await apiFetch(`/api/support/tickets/${id}`, { method: 'POST', body: JSON.stringify({ body: reply }) });
      setReply(''); load();
    } catch (e) { push({ tone: 'error', title: 'Reply failed', body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Support</h1>
          <p className="mt-0.5 text-[12px] text-muted">Open a ticket, follow the conversation, and browse common answers.</p>
        </div>
        <button onClick={() => setOpenNew(true)} className="btn-primary px-3.5 py-2 text-[12.5px]">New ticket</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-[13px] font-semibold text-white">Your tickets</p></div>
          {tickets.length === 0 ? <EmptyState title="No tickets yet" body="Open a ticket for account, deposit, withdrawal, trading or verification questions." /> : (
            <div className="divide-y divide-white/[0.05]">
              {tickets.map((t) => (
                <div key={t.id} className="px-4 py-3">
                  <div className="flex cursor-pointer items-start justify-between gap-3" onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-semibold text-white">{t.subject}</p>
                      <p className="mt-0.5 text-[10.5px] text-muted">{t.category} · updated {relTime(t.updatedAt)} · {t.messages.length} messages</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge tone={t.priority === 'URGENT' ? 'red' : t.priority === 'HIGH' ? 'amber' : 'gray'}>{t.priority}</Badge>
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                  {expanded === t.id && (
                    <div className="mt-3 space-y-2">
                      {t.messages.map((m) => (
                        <div key={m.id} className={`rounded-xl px-3 py-2 text-[11.5px] leading-relaxed ${m.isStaff ? 'border border-lime/20 bg-lime/[0.06] text-white/90' : 'border border-white/[0.07] bg-ink-900/60 text-white/80'}`}>
                          <p className="mb-1 text-[9.5px] uppercase tracking-wide text-muted">{m.isStaff ? 'Support' : 'You'} · {relTime(m.createdAt)}</p>
                          {m.body}
                        </div>
                      ))}
                      {t.status !== 'CLOSED' && (
                        <div className="flex gap-2">
                          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" className="field-sm flex-1" />
                          <button onClick={() => sendReply(t.id)} disabled={!reply.trim()} className="btn-primary px-3 py-1.5 text-[11.5px]">Send</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel p-4">
          <p className="text-[13px] font-semibold text-white">Frequently asked</p>
          <div className="mt-2 divide-y divide-white/[0.07]">
            {FAQS.map(([q, a]) => (
              <details key={q} className="group py-2.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[12px] font-medium text-white">
                  {q}<span className="text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <Modal
        open={openNew}
        onClose={() => setOpenNew(false)}
        title="New support ticket"
        footer={<><button className="btn-ghost" onClick={() => setOpenNew(false)}>Cancel</button><button className="btn-primary" onClick={submit} disabled={busy || form.subject.length < 4 || form.message.length < 10}>{busy ? 'Sending…' : 'Create ticket'}</button></>}
      >
        <div className="space-y-2.5">
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="field" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="field">
              {['ACCOUNT', 'DEPOSIT', 'WITHDRAWAL', 'TRADING', 'VERIFICATION', 'TECHNICAL', 'OTHER'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="field">
              {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder="Describe the issue, including any transaction or ticket references." className="field resize-none" />
        </div>
      </Modal>
    </div>
  );
}
