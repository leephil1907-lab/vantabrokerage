'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, EmptyState, Tabs, apiFetch, useToast } from '@/components/ui';
import { relTime } from '@/lib/format';

type Msg = { id: string; sender: string; body: string; createdAt: string };
type SessionRow = {
  id: string; displayName: string | null; contact: string | null; status: string;
  createdAt: string; updatedAt: string; messageCount: number;
  lastMessage: { sender: string; body: string; createdAt: string } | null;
};

/**
 * Admin live-chat console: every conversation opened through the
 * "PRIMEVEST Customer Support" widget lands here; agents read the full
 * thread (including assistant answers) and reply in real time.
 */
export default function AdminLiveChat() {
  const [tab, setTab] = useState<'OPEN' | 'CLOSED' | 'ALL'>('OPEN');
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [thread, setThread] = useState<{ session: SessionRow | null; messages: Msg[] } | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const { push } = useToast();
  const scroller = useRef<HTMLDivElement | null>(null);

  const loadList = useCallback(async () => {
    try {
      const body = await apiFetch<{ sessions: SessionRow[] }>(`/api/admin/chat?status=${tab}`);
      setSessions(body.sessions);
    } catch { /* keep last good list */ }
  }, [tab]);

  const loadThread = useCallback(async (id: string) => {
    try {
      const body = await apiFetch<{ session: SessionRow; messages: Msg[] }>(`/api/admin/chat/${id}`);
      setThread({ session: body.session, messages: body.messages });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { void loadList(); }, [loadList]);
  useEffect(() => {
    const t = setInterval(() => { void loadList(); if (active) void loadThread(active); }, 4000);
    return () => clearInterval(t);
  }, [loadList, loadThread, active]);

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }); }, [thread?.messages.length]);

  const send = async (status?: 'CLOSED') => {
    if (!active) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/chat/${active}`, { method: 'POST', body: JSON.stringify({ ...(reply.trim() ? { reply: reply.trim() } : {}), ...(status ? { status } : {}) }) });
      setReply('');
      await loadThread(active);
      await loadList();
      if (status) push({ tone: 'success', title: 'Conversation closed' });
    } catch (e) {
      push({ tone: 'error', title: 'Send failed', body: (e as Error).message });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-white">Live chat console</h1>
          <p className="mt-0.5 text-[12px] text-muted">Conversations from the PRIMEVEST Customer Support widget — assistant answers shown in gold, your replies reach the visitor within seconds.</p>
        </div>
        <Tabs tabs={[{ id: 'OPEN' as const, label: 'Open' }, { id: 'CLOSED' as const, label: 'Closed' }, { id: 'ALL' as const, label: 'All' }]} value={tab} onChange={setTab} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="panel max-h-[560px] overflow-y-auto p-2">
          {!sessions.length && <EmptyState title="No conversations" body="Visitor chats from the support widget will appear here." />}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActive(s.id); void loadThread(s.id); }}
              className={`mb-1 w-full rounded-xl px-3 py-2.5 text-left transition-colors ${active === s.id ? 'bg-gold/10' : 'hover:bg-white/[0.04]'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[12.5px] font-semibold text-white">{s.displayName ?? s.contact ?? `Visitor ${s.id.slice(-6)}`}</p>
                <span className="shrink-0 text-[9.5px] text-muted">{relTime(s.updatedAt)}</span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{s.lastMessage ? `${s.lastMessage.sender === 'VISITOR' ? 'Visitor: ' : s.lastMessage.sender === 'AGENT' ? 'You: ' : 'Bot: '}${s.lastMessage.body}` : 'No messages yet'}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone={s.status === 'OPEN' ? 'green' : 'gray'}>{s.status}</Badge>
                <span className="text-[9.5px] text-muted">{s.messageCount} messages</span>
              </div>
            </button>
          ))}
        </div>

        <div className="panel flex min-h-[560px] flex-col">
          {!thread ? (
            <EmptyState title="Select a conversation" body="Choose a visitor on the left to read the thread and reply." />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
                <div>
                  <p className="text-[13px] font-semibold text-white">{thread.session?.displayName ?? thread.session?.contact ?? `Visitor ${active?.slice(-6)}`}</p>
                  <p className="text-[10.5px] text-muted">{thread.session?.contact ?? 'no contact provided'} · opened {thread.session ? relTime(thread.session.createdAt) : ''}</p>
                </div>
                {thread.session?.status === 'OPEN' && (
                  <button onClick={() => void send('CLOSED')} className="btn-ghost px-3 py-1.5 text-[11px]">Close conversation</button>
                )}
              </div>
              <div ref={scroller} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
                {thread.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'AGENT' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                      m.sender === 'AGENT' ? 'rounded-br-md bg-gold/90 text-ink-950'
                        : m.sender === 'BOT' ? 'rounded-bl-md border border-white/[0.08] bg-white/[0.03] text-white/85'
                        : 'rounded-bl-md border border-sky-400/25 bg-sky-400/[0.07] text-white'
                    }`}>
                      <p className={`mb-1 text-[9px] font-bold uppercase tracking-[0.14em] ${m.sender === 'AGENT' ? 'text-ink-950/70' : m.sender === 'BOT' ? 'text-gold' : 'text-sky-300'}`}>
                        {m.sender === 'AGENT' ? 'You (agent)' : m.sender === 'BOT' ? 'Assistant bot' : 'Visitor'}
                      </p>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className={`mt-1 text-[9px] ${m.sender === 'AGENT' ? 'text-ink-950/60' : 'text-muted'}`}>{relTime(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); void send(); }}
                className="flex items-center gap-2 border-t border-white/[0.07] px-4 py-3"
              >
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply as support agent…" className="field-sm flex-1" maxLength={4000} />
                <button type="submit" disabled={busy || !reply.trim()} className="btn-primary px-4 py-2 text-[12px] disabled:opacity-50">Send reply</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
