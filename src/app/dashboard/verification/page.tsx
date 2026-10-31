'use client';

import { useEffect, useState } from 'react';
import { Badge, StatusBadge, apiFetch, useToast } from '@/components/ui';

type Kyc = { status: string; level?: number; documentType?: string | null; documentCountry?: string | null; fullName?: string | null; submittedAt?: string | null; reviewedAt?: string | null; rejectionReason?: string | null; documents?: { label: string; filename: string }[] };

export default function VerificationPage() {
  const [kyc, setKyc] = useState<Kyc | null>(null);
  const [form, setForm] = useState({ fullName: '', dateOfBirth: '', documentType: 'PASSPORT', documentNumber: '', documentCountry: '', address: '' });
  const [docs, setDocs] = useState<{ label: string; filename: string; dataUrl: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const load = () => apiFetch<{ kyc: Kyc }>('/api/kyc').then((b) => setKyc(b.kyc)).catch(() => undefined);
  useEffect(() => { load(); }, []);

  const attach = (label: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_500_000) { push({ tone: 'error', title: 'File too large', body: 'Attachments must be under 2.5 MB.' }); return; }
    const reader = new FileReader();
    reader.onload = () => setDocs((d) => [...d.filter((x) => x.label !== label), { label, filename: file.name, dataUrl: String(reader.result) }]);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setBusy(true);
    try {
      await apiFetch('/api/kyc', { method: 'POST', body: JSON.stringify({ ...form, documents: docs }) });
      push({ tone: 'success', title: 'Verification submitted', body: 'Compliance will review your documents. Withdrawals unlock on approval.' });
      load();
    } catch (e) { push({ tone: 'error', title: 'Submission failed', body: (e as Error).message }); }
    finally { setBusy(false); }
  };

  const locked = kyc && ['PENDING', 'APPROVED'].includes(kyc.status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Account verification</h1>
          <p className="mt-0.5 text-[12px] text-muted">Identity verification is required by compliance before withdrawals and higher limits.</p>
        </div>
        {kyc && <StatusBadge status={kyc.status} />}
      </div>

      {kyc?.status === 'APPROVED' && (
        <div className="rounded-xl border border-emerald/25 bg-emerald/[0.07] px-4 py-3">
          <p className="text-[12.5px] font-semibold text-emerald">Identity verified</p>
          <p className="mt-0.5 text-[11.5px] text-muted">Approved {kyc.reviewedAt ? new Date(kyc.reviewedAt).toLocaleDateString('en-GB') : ''}. Withdrawals and higher limits are enabled.</p>
        </div>
      )}
      {kyc?.status === 'PENDING' && (
        <div className="rounded-xl border border-siren/25 bg-siren/[0.07] px-4 py-3">
          <p className="text-[12.5px] font-semibold text-siren">Under review</p>
          <p className="mt-0.5 text-[11.5px] text-muted">Submitted {kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleString('en-GB') : ''}. You will be notified when compliance completes the review.</p>
        </div>
      )}
      {kyc?.status === 'REJECTED' && (
        <div className="rounded-xl border border-danger/25 bg-danger/[0.07] px-4 py-3">
          <p className="text-[12.5px] font-semibold text-danger">Verification rejected</p>
          <p className="mt-0.5 text-[11.5px] text-muted">{kyc.rejectionReason} You may resubmit corrected documents below.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="panel p-4">
          <p className="text-[13px] font-semibold text-white">Identity details</p>
          <div className="mt-3 space-y-3">
            <label className="block"><span className="label">Full legal name</span><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} disabled={!!locked} className="field mt-1.5" placeholder="As shown on your ID" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="label">Date of birth</span><input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} disabled={!!locked} className="field mt-1.5" /></label>
              <label className="block">
                <span className="label">Document type</span>
                <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} disabled={!!locked} className="field mt-1.5">
                  <option value="PASSPORT">Passport</option>
                  <option value="NATIONAL_ID">National ID</option>
                  <option value="DRIVERS_LICENSE">Driver's licence</option>
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="label">Document number</span><input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} disabled={!!locked} className="field mt-1.5" /></label>
              <label className="block"><span className="label">Issuing country</span><input value={form.documentCountry} onChange={(e) => setForm({ ...form, documentCountry: e.target.value })} disabled={!!locked} className="field mt-1.5" placeholder="e.g. Nigeria" /></label>
            </div>
            <label className="block"><span className="label">Residential address</span><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={!!locked} className="field mt-1.5" /></label>

            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { label: 'ID_FRONT', text: 'Document front' },
                { label: 'SELFIE', text: 'Selfie with document' },
              ].map((d) => (
                <label key={d.label} className="cursor-pointer rounded-xl border border-dashed border-white/15 bg-ink-900/50 px-3 py-3 text-center transition hover:border-lime/40">
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={attach(d.label)} disabled={!!locked} />
                  <p className="text-[11.5px] font-medium text-white">{d.text}</p>
                  <p className="mt-0.5 text-[10px] text-muted">{docs.find((x) => x.label === d.label)?.filename ?? 'PNG, JPG or PDF · max 2.5 MB'}</p>
                </label>
              ))}
            </div>

            <button onClick={submit} disabled={busy || !!locked || !form.fullName || !form.dateOfBirth || !form.documentNumber || !form.address} className="btn-primary w-full py-2 text-[12.5px]">
              {busy ? 'Submitting…' : kyc?.status === 'REJECTED' ? 'Resubmit verification' : 'Submit for verification'}
            </button>
          </div>
        </section>

        <section className="panel p-4">
          <p className="text-[13px] font-semibold text-white">What happens next</p>
          <ol className="mt-3 space-y-3 text-[11.5px] leading-relaxed text-muted">
            {[
              'Compliance reviews your document images and details — usually within one business day.',
              'You receive a notification with the outcome. Rejections include the reason so you can resubmit.',
              'On approval, withdrawal limits unlock and your account status reflects the verified level.',
              'Documents are stored against your KYC record and are only visible to authorised staff in the admin console.',
            ].map((t, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lime/30 bg-lime/10 text-[10px] font-bold text-lime">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-xl border border-white/[0.07] bg-ink-900/60 p-3">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-white">Deployment note</p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
              {process.env.NEXT_PUBLIC_KYC_PROVIDER
                ? 'An automated KYC provider is configured for this deployment.'
                : 'No automated KYC provider is configured, so submissions go to the manual compliance queue in the admin console.'}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
