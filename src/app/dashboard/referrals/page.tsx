'use client';

import { useEffect, useState } from 'react';
import { Badge, EmptyState, StatusBadge, apiFetch, useToast, ConfirmButton } from '@/components/ui';
import { fmtMoney } from '@/lib/format';

type Payload = {
  referralCode: string; link: string; commissionRate: number;
  stats: { registered: number; qualified: number; totalEarned: number; pending: number; paid: number };
  referrals: { id: string; email: string; status: string; createdAt: string; qualifiedAt: string | null }[];
  commissions: { id: string; amount: number; rate: number; sourceType: string; status: string; createdAt: string }[];
  canRequestPayout: boolean;
};

export default function ReferralsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const { push } = useToast();

  const load = () => apiFetch<Payload>('/api/referrals').then(setData).catch(() => undefined);
  useEffect(() => { load(); }, []);

  const payout = async () => {
    try {
      const res = await apiFetch<{ paid: number }>('/api/referrals', { method: 'POST', body: JSON.stringify({ confirm: true }) });
      push({ tone: 'success', title: 'Commission paid', body: `${fmtMoney(res.paid)} credited to your live account.` });
      load();
    } catch (e) { push({ tone: 'error', title: 'Payout failed', body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Referral program</h1>
        <p className="mt-0.5 text-[12px] text-muted">Commissions accrue from verified deposits by referred clients and require approval before payout.</p>
      </div>

      {!data ? <div className="panel p-8 text-center text-[12px] text-muted">Loading referral data…</div> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Registered referrals" value={String(data.stats.registered)} />
            <Stat label="Qualified" value={String(data.stats.qualified)} />
            <Stat label="Pending commission" value={fmtMoney(data.stats.pending)} />
            <Stat label="Paid to date" value={fmtMoney(data.stats.paid)} accent />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <section className="panel p-4">
              <p className="text-[13px] font-semibold text-white">Your referral link</p>
              <p className="mt-1 text-[11.5px] text-muted">Commission rate: {(data.commissionRate * 100).toFixed(0)}% of verified referred deposits.</p>
              <div className="mt-3 space-y-2">
                <div className="rounded-xl border border-white/[0.07] bg-ink-900/60 p-2.5">
                  <p className="label">Code</p>
                  <p className="value-mono mt-0.5 text-[14px] font-semibold text-lime">{data.referralCode}</p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-ink-900/60 p-2.5">
                  <p className="label">Link</p>
                  <p className="mt-0.5 break-all text-[11px] text-white/80">{data.link}</p>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(data.link); push({ tone: 'success', title: 'Link copied' }); }}
                    className="btn-ghost mt-2 w-full py-1.5 text-[11px]"
                  >
                    Copy link
                  </button>
                </div>
              </div>
              <ConfirmButton
                onConfirm={payout}
                title="Request commission payout"
                description={`${fmtMoney(data.commissions.filter((c) => c.status === 'APPROVED').reduce((s, c) => s + c.amount, 0))} of approved commission will be credited to your live account balance.`}
                confirmLabel="Pay out"
                className="btn-primary mt-3 w-full py-2 text-[12.5px]"
                disabled={!data.commissions.some((c) => c.status === 'APPROVED')}
              >
                Request payout
              </ConfirmButton>
              {!data.commissions.some((c) => c.status === 'APPROVED') && (
                <p className="mt-2 text-[10.5px] leading-relaxed text-muted">Commissions must be approved by the affiliate desk before they can be paid out.</p>
              )}
            </section>

            <section className="space-y-4">
              <div className="panel overflow-hidden">
                <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-[13px] font-semibold text-white">Referrals</p></div>
                {data.referrals.length === 0 ? <EmptyState title="No referrals yet" body="Share your link — new registrations appear here." /> : (
                  <table className="w-full">
                    <thead><tr><th className="th">Email</th><th className="th">Status</th><th className="th">Registered</th></tr></thead>
                    <tbody>
                      {data.referrals.map((r) => (
                        <tr key={r.id} className="table-row">
                          <td className="td text-[11.5px]">{r.email}</td>
                          <td className="td"><StatusBadge status={r.status} /></td>
                          <td className="td text-[11px] text-muted">{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="panel overflow-hidden">
                <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-[13px] font-semibold text-white">Commission history</p></div>
                {data.commissions.length === 0 ? <EmptyState title="No commissions yet" body="Commission is calculated from verified referred deposits." /> : (
                  <table className="w-full">
                    <thead><tr><th className="th">Amount</th><th className="th">Rate</th><th className="th">Source</th><th className="th">Status</th><th className="th">Date</th></tr></thead>
                    <tbody>
                      {data.commissions.map((c) => (
                        <tr key={c.id} className="table-row">
                          <td className="td value-mono font-medium text-white">{fmtMoney(c.amount)}</td>
                          <td className="td value-mono text-[11px] text-muted">{(c.rate * 100).toFixed(0)}%</td>
                          <td className="td text-[11px] text-muted">{c.sourceType}</td>
                          <td className="td"><StatusBadge status={c.status} /></td>
                          <td className="td text-[11px] text-muted">{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`panel p-4 ${accent ? 'ring-1 ring-lime/20' : ''}`}>
      <p className="label">{label}</p>
      <p className="value-mono mt-1.5 text-[19px] font-semibold text-white">{value}</p>
    </div>
  );
}
