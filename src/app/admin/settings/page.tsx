'use client';

import { useEffect, useState } from 'react';
import { Badge, apiFetch, useToast } from '@/components/ui';

export default function AdminSettings() {
  const [configs, setConfigs] = useState<{ key: string; value: unknown; category: string }[]>([]);
  const [env, setEnv] = useState<Record<string, string | null>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const load = () => apiFetch<{ configs: any[]; environment: any }>('/api/admin/settings')
    .then((b) => { setConfigs(b.configs); setEnv(b.environment); setDraft(Object.fromEntries(b.configs.map((c: any) => [c.key, JSON.stringify(c.value)]))); })
    .catch((e) => push({ tone: 'error', title: 'Load failed', body: e.message }));

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const save = async () => {
    setBusy(true);
    try {
      const updates = Object.entries(draft).map(([key, raw]) => {
        let value: unknown;
        try { value = JSON.parse(raw); } catch { value = raw; }
        return { key, value };
      });
      await apiFetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ updates }) });
      push({ tone: 'success', title: 'Configuration saved', body: 'Every change is recorded in the audit log with before/after values.' });
      load();
    } catch (e) { push({ tone: 'error', title: 'Save failed', body: (e as Error).message }); }
    finally { setBusy(false); }
  };

  const grouped = configs.reduce<Record<string, typeof configs>>((acc, c) => { (acc[c.category] ||= []).push(c); return acc; }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Platform settings</h1>
          <p className="mt-0.5 text-[12px] text-muted">Runtime configuration and integration state. Secrets live in server environment variables only.</p>
        </div>
        <button onClick={save} disabled={busy} className="btn-primary px-4 py-2 text-[12.5px]">{busy ? 'Saving…' : 'Save configuration'}</button>
      </div>

      <section className="panel p-4">
        <p className="text-[13px] font-semibold text-white">Environment</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(env).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-white/[0.07] bg-ink-900/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted">{k.replace(/([A-Z])/g, ' $1')}</p>
              <p className="mt-0.5 text-[11.5px] text-white">{v ?? 'not set'}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
          Provider credentials (API keys, custody keys, SMTP secrets) are never exposed to the browser. Only whether a provider is configured is shown.
        </p>
      </section>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="panel p-4">
          <p className="text-[13px] font-semibold capitalize text-white">{category}</p>
          <div className="mt-3 space-y-2.5">
            {items.map((c) => (
              <div key={c.key} className="grid gap-2 sm:grid-cols-[1fr_1.2fr] sm:items-center">
                <div>
                  <p className="text-[11.5px] font-medium text-white">{c.key}</p>
                  <p className="text-[10px] text-muted">JSON value</p>
                </div>
                <input value={draft[c.key] ?? ''} onChange={(e) => setDraft({ ...draft, [c.key]: e.target.value })} className="field-sm font-mono text-[11px]" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
