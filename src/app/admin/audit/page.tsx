'use client';

import { useEffect, useState } from 'react';
import { Badge, apiFetch } from '@/components/ui';

type Log = { id: string; actor: string; role: string; action: string; targetType: string; targetId: string | null; before: unknown; after: unknown; ip: string | null; createdAt: string };

export default function AdminAudit() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => { apiFetch<{ logs: Log[] }>('/api/admin/audit').then((b) => setLogs(b.logs)).catch(() => undefined); }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Audit log</h1>
        <p className="mt-0.5 text-[12px] text-muted">Every privileged action with actor, IP, timestamp and a before/after diff.</p>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full">
          <thead><tr><th className="th">When</th><th className="th">Actor</th><th className="th">Action</th><th className="th">Target</th><th className="th">IP</th><th className="th"></th></tr></thead>
          <tbody>
            {logs.length === 0 && <tr><td className="td text-muted" colSpan={6}>No audit entries recorded yet.</td></tr>}
            {logs.map((l) => (
              <>
                <tr key={l.id} className="table-row">
                  <td className="td whitespace-nowrap text-[11px] text-muted">{new Date(l.createdAt).toLocaleString('en-GB')}</td>
                  <td className="td text-[11.5px] text-white">{l.actor}<span className="ml-1 text-[10px] text-muted">{l.role}</span></td>
                  <td className="td"><Badge tone={l.action.includes('reject') || l.action.includes('suspend') ? 'red' : 'lime'}>{l.action}</Badge></td>
                  <td className="td text-[11px] text-muted">{l.targetType}{l.targetId ? ` · ${l.targetId.slice(0, 10)}` : ''}</td>
                  <td className="td value-mono text-[10.5px] text-muted">{l.ip ?? '—'}</td>
                  <td className="td text-right"><button onClick={() => setOpen(open === l.id ? null : l.id)} className="text-[10.5px] text-lime hover:underline">{open === l.id ? 'Hide' : 'Diff'}</button></td>
                </tr>
                {open === l.id && (
                  <tr key={`${l.id}-diff`}>
                    <td colSpan={6} className="bg-ink-900/60 px-4 py-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted">Before</p>
                          <pre className="mt-1 overflow-x-auto rounded-lg border border-white/[0.07] bg-ink-950 p-2 text-[10.5px] text-white/80">{JSON.stringify(l.before, null, 2)}</pre>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted">After</p>
                          <pre className="mt-1 overflow-x-auto rounded-lg border border-white/[0.07] bg-ink-950 p-2 text-[10.5px] text-white/80">{JSON.stringify(l.after, null, 2)}</pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
