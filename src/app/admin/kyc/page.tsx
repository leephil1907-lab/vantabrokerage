'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, EmptyState, apiFetch, useToast, Modal } from '@/components/ui';
import { relTime } from '@/lib/format';

type Record = { id: string; userId: string; email: string; status: string; fullName: string | null; documentType: string | null; documentNumber: string | null; documentCountry: string | null; address: string | null; documents: { label: string; filename: string; dataUrl?: string }[]; submittedAt: string | null };

export default function AdminKyc() {
  const [records, setRecords] = useState<Record[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [viewer, setViewer] = useState<{ label: string; dataUrl: string } | null>(null);
  const [reject, setReject] = useState<Record | null>(null);
  const [reason, setReason] = useState('');
  const { push } = useToast();

  const load = useCallback(() => {
    apiFetch<{ records: Record[] }>(`/api/admin/kyc?status=${status}`).then((b) => setRecords(b.records)).catch(() => undefined);
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const decide = async (r: Record, decision: 'APPROVED' | 'REJECTED', note?: string) => {
    try {
      await apiFetch(`/api/admin/kyc/${r.id}`, { method: 'POST', body: JSON.stringify({ decision, reason: note }) });
      push({ tone: 'success', title: `Verification ${decision.toLowerCase()}`, body: `${r.email} notified and the action was audit-logged.` });
      setReject(null); setReason('');
      load();
    } catch (e) { push({ tone: 'error', title: 'Action failed', body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Verification queue</h1>
          <p className="mt-0.5 text-[12px] text-muted">Review identity submissions. Approval unlocks withdrawals for the client.</p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-sm w-40">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {records.length === 0 ? (
        <div className="panel"><EmptyState title="Nothing in this queue" body="Submissions appear here as clients complete identity verification." /></div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {records.map((r) => (
            <div key={r.id} className="panel p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-white">{r.fullName ?? '—'}</p>
                  <p className="text-[11px] text-muted">{r.email} · submitted {relTime(r.submittedAt)}</p>
                </div>
                <Badge tone={r.status === 'APPROVED' ? 'green' : r.status === 'REJECTED' ? 'red' : 'amber'}>{r.status}</Badge>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                <div><dt className="text-muted">Document</dt><dd className="text-white">{r.documentType}</dd></div>
                <div><dt className="text-muted">Number</dt><dd className="value-mono text-white">{r.documentNumber}</dd></div>
                <div><dt className="text-muted">Country</dt><dd className="text-white">{r.documentCountry}</dd></div>
                <div><dt className="text-muted">Address</dt><dd className="truncate text-white">{r.address}</dd></div>
              </dl>
              {r.documents?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.documents.map((d, i) => (
                    <button key={i} onClick={() => d.dataUrl && setViewer({ label: `${d.label} · ${d.filename}`, dataUrl: d.dataUrl })} className="chip hover:border-lime/40 hover:text-lime">
                      {d.label} · {d.filename.slice(0, 16)}
                    </button>
                  ))}
                </div>
              )}
              {r.status === 'PENDING' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => decide(r, 'APPROVED')} className="btn-primary flex-1 py-1.5 text-[11.5px]">Approve</button>
                  <button onClick={() => setReject(r)} className="btn-ghost flex-1 py-1.5 text-[11.5px]">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!viewer} onClose={() => setViewer(null)} title={viewer?.label ?? 'Document'} width="max-w-2xl">
        {viewer && <img src={viewer.dataUrl} alt={viewer.label} className="max-h-[70vh] w-full rounded-lg object-contain" />}
      </Modal>

      <Modal
        open={!!reject}
        onClose={() => setReject(null)}
        title="Reject verification"
        description="The client sees this reason and can resubmit."
        footer={<><button className="btn-ghost" onClick={() => setReject(null)}>Cancel</button><button className="btn-danger" disabled={reason.trim().length < 5} onClick={() => reject && decide(reject, 'REJECTED', reason)}>Reject</button></>}
      >
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="field resize-none" placeholder="Reason for rejection" />
      </Modal>
    </div>
  );
}
