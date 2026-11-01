'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PrimevestGlyph } from '@/components/brand';

/**
 * PRIMEVEST Customer Support — live chat widget.
 * Visitors talk to the support assistant instantly; unanswered questions are
 * queued for human agents who reply from the admin live-chat console
 * (/admin/chat). The conversation token lives in localStorage so a visitor
 * keeps their thread across pages and reloads.
 */
type Msg = { id: string; sender: 'VISITOR' | 'AGENT' | 'BOT'; body: string; createdAt: string };

const TOKEN_KEY = 'primevest.chat.token';

function Bubble({ m }: { m: Msg }) {
  const mine = m.sender === 'VISITOR';
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
        mine
          ? 'rounded-br-md bg-gold/90 text-ink-950'
          : m.sender === 'AGENT'
            ? 'rounded-bl-md border border-emerald/25 bg-emerald/[0.08] text-white'
            : 'rounded-bl-md border border-white/[0.08] bg-white/[0.04] text-white/90'
      }`}>
        {!mine && (
          <p className={`mb-1 text-[9px] font-bold uppercase tracking-[0.14em] ${m.sender === 'AGENT' ? 'text-emerald' : 'text-gold'}`}>
            {m.sender === 'AGENT' ? 'Support agent' : 'PRIMEVEST assistant'}
          </p>
        )}
        <p className="whitespace-pre-wrap">{m.body}</p>
      </div>
    </motion.li>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const scroller = useRef<HTMLUListElement | null>(null);
  const loaded = useRef(false);

  // Restore the visitor token once on the client.
  useEffect(() => {
    try { setToken(localStorage.getItem(TOKEN_KEY)); } catch { /* private mode */ }
  }, []);

  // Other components (e.g. the 404 scene) can request the panel open.
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener('primevest:chat-open', openChat);
    return () => window.removeEventListener('primevest:chat-open', openChat);
  }, []);

  const pull = useCallback(async (tk: string) => {
    try {
      const res = await fetch(`/api/support/chat?token=${encodeURIComponent(tk)}`, { cache: 'no-store' });
      if (!res.ok) return;
      const body = (await res.json()) as { session: { status: string } | null; messages: Msg[] };
      if (body.session) { setMessages(body.messages); setStatus(body.session.status); }
    } catch { /* polling is best-effort */ }
  }, []);

  // Initial load + 4s poll while open.
  useEffect(() => {
    if (!open || !token) return;
    void pull(token);
    const t = setInterval(() => void pull(token), 4000);
    return () => clearInterval(t);
  }, [open, token, pull]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing, open]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true); setTyping(true); setText('');
    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token ?? undefined, name, contact, message: body }),
      });
      const data = (await res.json()) as { token: string; messages: Msg[] };
      if (!res.ok) throw new Error('Chat unavailable');
      if (!token) {
        setToken(data.token);
        try { localStorage.setItem(TOKEN_KEY, data.token); } catch { /* ignore */ }
      }
      setMessages(data.messages);
      setStatus('OPEN');
      loaded.current = true;
    } catch {
      setText(body);
    } finally {
      setBusy(false); setTyping(false);
    }
  };

  return (
    <>
      <motion.button
        type="button"
        aria-label="Open PRIMEVEST Customer Support chat"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-[calc(70px+env(safe-area-inset-bottom))] right-3 z-[90] flex h-12 w-12 items-center justify-center rounded-full md:bottom-5 md:right-5 md:h-14 md:w-14 md:bottom-5 md:right-5 bg-gradient-to-br from-gold to-gold-600 text-ink-950 shadow-[0_10px_36px_-10px_rgba(223,192,136,0.65)]"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
        )}
        {!open && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-ink-950 bg-emerald" aria-hidden />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label="PRIMEVEST Customer Support"
            className="fixed bottom-[calc(126px+env(safe-area-inset-bottom))] right-3 z-[90] flex h-[min(520px,calc(100dvh-216px))] md:bottom-24 md:right-5 md:h-[min(560px,calc(100dvh-120px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900/97 shadow-2xl backdrop-blur-xl sm:right-5"
          >
            <div className="relative flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold"><PrimevestGlyph size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[14px] font-semibold text-white">PRIMEVEST Customer Support</p>
                <p className="flex items-center gap-1.5 text-[10px] text-muted">
                  <span className={`h-1.5 w-1.5 rounded-full ${status === 'CLOSED' ? 'bg-siren' : 'bg-emerald'}`} />
                  {status === 'CLOSED' ? 'Closed — send a message to reopen' : 'Online · assistant + human agents'}
                </p>
              </div>
            </div>

            <ul ref={scroller} className="flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3.5">
              {messages.length === 0 && (
                <li className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-[11.5px] leading-relaxed text-muted">
                  Welcome to <span className="font-semibold text-gold">PRIMEVEST Customer Support</span>. Send a message and our
                  assistant answers instantly — a human agent can join at any time.
                </li>
              )}
              {messages.map((m) => <Bubble key={m.id} m={m} />)}
              {typing && (
                <li className="flex justify-start">
                  <span className="rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-[11px] text-muted">assistant is typing…</span>
                </li>
              )}
            </ul>

            {messages.length === 0 && (
              <div className="grid grid-cols-2 gap-2 border-t border-white/[0.07] px-3.5 pt-2.5">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className="field-sm" maxLength={80} />
                <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email (optional)" className="field-sm" maxLength={120} />
              </div>
            )}

            <form onSubmit={send} className="flex items-center gap-2 px-3.5 py-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your message…"
                aria-label="Message"
                className="field-sm flex-1"
                maxLength={2000}
              />
              <button type="submit" disabled={busy || !text.trim()} className="btn-primary px-3.5 py-2 text-[12px] disabled:opacity-50">
                Send <span aria-hidden>↗</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
