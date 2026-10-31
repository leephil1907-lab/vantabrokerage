'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/* ───────────────────────── Toasts ───────────────────────── */
type Toast = { id: number; title: string; body?: string; tone: 'success' | 'error' | 'info' };
const ToastCtx = createContext<{ push: (t: Omit<Toast, 'id'>) => void }>({ push: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 5200);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-fadeUp rounded-xl border p-3.5 shadow-panel backdrop-blur-md ${
              t.tone === 'success' ? 'border-emerald/30 bg-emerald/10' : t.tone === 'error' ? 'border-danger/30 bg-danger/10' : 'border-white/10 bg-ink-800/95'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${t.tone === 'success' ? 'bg-emerald' : t.tone === 'error' ? 'bg-danger' : 'bg-lime'}`} />
              <div>
                <p className="text-[13px] font-semibold text-white">{t.title}</p>
                {t.body && <p className="mt-0.5 text-xs leading-relaxed text-muted">{t.body}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

/* ───────────────────────── Modal ───────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} animate-fadeUp rounded-2xl border border-white/10 bg-ink-850 shadow-panel`}>
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-white">{title}</h3>
            {description && <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-white" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-white/[0.07] px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

/* ───────────────────────── Confirm ───────────────────────── */
export function ConfirmButton({
  onConfirm,
  children,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'primary',
  className,
  disabled,
}: {
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: 'primary' | 'danger';
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} disabled={disabled}>
        {children}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
            <button
              className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try { await onConfirm(); setOpen(false); } finally { setBusy(false); }
              }}
            >
              {busy ? 'Working…' : confirmLabel}
            </button>
          </>
        }
      />
    </>
  );
}

/* ───────────────────────── States ───────────────────────── */
export function Skeleton({ className = 'h-4 w-24' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 13V7m4 6V4m4 9V9m4 4V6" stroke="#8a97a6" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
      {body && <p className="max-w-sm text-xs leading-relaxed text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger">!</div>
      <p className="max-w-sm text-xs leading-relaxed text-muted">{message}</p>
      {onRetry && <button className="btn-ghost px-3 py-1.5 text-xs" onClick={onRetry}>Try again</button>}
    </div>
  );
}

/* ───────────────────────── Badges ───────────────────────── */
const TONES: Record<string, string> = {
  green: 'border-emerald/25 bg-emerald/10 text-emerald',
  red: 'border-danger/25 bg-danger/10 text-danger',
  amber: 'border-siren/25 bg-siren/10 text-siren',
  lime: 'border-lime/25 bg-lime/10 text-lime',
  gray: 'border-white/10 bg-white/[0.04] text-muted',
  blue: 'border-sky-400/25 bg-sky-400/10 text-sky-300',
};

export function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: keyof typeof TONES }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${TONES[tone] ?? TONES.gray}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, keyof typeof TONES> = {
    ACTIVE: 'green', COMPLETED: 'green', CREDITED: 'green', APPROVED: 'green', FILLED: 'green', WIN: 'green', OPEN: 'lime',
    PENDING: 'amber', CONFIRMING: 'amber', UNDER_REVIEW: 'amber', PROCESSING: 'amber', QUALIFIED: 'amber', PAUSED: 'amber', WARNING: 'amber',
    REJECTED: 'red', FAILED: 'red', LOSS: 'red', SUSPENDED: 'red', CLOSED: 'gray', CANCELLED: 'gray', RESTRICTED: 'red',
    RESOLVED: 'green', DRAW: 'gray', PAPER: 'blue', LIVE: 'lime', STOPPED: 'gray', LIQUIDATED: 'red',
  };
  return <Badge tone={map[status] ?? 'gray'}>{status.replace(/_/g, ' ')}</Badge>;
}

/* ───────────────────────── Tabs ───────────────────────── */
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-white/[0.07] scroll-thin">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`relative whitespace-nowrap px-3.5 py-2.5 text-[12.5px] font-medium transition-colors ${
            value === t.id ? 'text-white' : 'text-muted hover:text-white/80'
          }`}
        >
          {t.label}
          {typeof t.count === 'number' && t.count > 0 && (
            <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">{t.count}</span>
          )}
          {value === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-lime" />}
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────── Data fetching helper ───────────────────────── */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = body?.error ?? { code: 'ERROR', message: `Request failed (${res.status})` };
    const e = new Error(err.message) as Error & { code: string; details: unknown; status: number };
    e.code = err.code;
    e.details = err.details;
    e.status = res.status;
    throw e;
  }
  return body as T;
}

export function usePolling<T>(url: string | null, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const run = async () => {
      try {
        const res = await apiFetch<T>(url);
        if (!cancelled) { setData(res); setError(null); }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) { setLoading(false); timer = setTimeout(run, intervalMs); }
      }
    };
    run();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [url, intervalMs, tick]);
  return { data, error, loading, refresh: () => setTick((t) => t + 1) };
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-xs leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
