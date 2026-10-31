'use client';

import { useCallback, useEffect, useState } from 'react';
import { EmptyState, StatusBadge, apiFetch, useToast } from '@/components/ui';
import { fmtMoney, relTime } from '@/lib/format';

export default function AdminAffiliates() {
  const [data, setData] = useState<any>(null);
  const { push } = useToast();

  const load = useCallback(() => apiFetch('/api/admin/affiliates').then(setData).catch(() => undefined), []);
  useEffect(() => { load(); }, [load]);

  const review = async (commissionId: string, action: 'approve' | 'reject') => {
    try {
      await apiFetch('/api/admin/affiliates', { method: 'POST', body: JSON.stringify({ commissionId, action }) });
      push({ tone: 'success', title: `Commission ${action}d` });
      load();
    } catch (e) { push({ tone: 'error', title: 'Action failed', body: (e as Error).message }); }
  };

  if (!data) return <div className="panel p-8 text-center text-[12px] text-muted">Loading affiliate data…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Affiliate management</h1>
        <p className="mt-0.5 text-[12px] text-muted">Referral relationships and commission approvals. Current commission rate: {(data.commissionRate * 100).toFixed(0)}%.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel overflow-hidden">
          <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-[13px] font-semibold text-white">Referrals</p></div>
          {data.referrals.length === 0 ? <EmptyState title="No referrals" body="Referred registrations appear here." /> : (
            <table className="w-full">
              <thead><tr><th className="th">Referrer</th><th className="th">Referee</th><th className="th">Status</th><th className="th">Date</th></tr></thead>
              <tbody>
                {data.referrals.map((r: any) => (
                  <tr key={r.id} className="table-row">
                    <td className="td text-[11.5px] text-white">{r.referrer}</td>
                    <td className="td text-[11px] text-muted">{r.referee}</td>
                    <td className="td"><StatusBadge status={r.status} /></td>
                    <td className="td text-[11px] text-muted">{relTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-[13px] font-semibold text-white">Commissions</p></div>
          {data.commissions.length === 0 ? <EmptyState title="No commissions" body="Commission accrues when referred clients make verified deposits." /> : (
            <table className="w-full">
              <thead><tr><th className="th">Beneficiary</th><th className="th text-right">Amount</th><th className="th">Status</th><th className="th"></th></tr></thead>
              <tbody>
                {data.commissions.map((c: any) => (
                  <tr key={c.id} className="table-row">
                    <td className="td text-[11.5px] text-white">{c.email}</td>
                    <td className="td text-right value-mono">{fmtMoney(c.amount)}</td>
                    <td className="td"><StatusBadge status={c.status} /></td>
                    <td className="td text-right">
                      {c.status === 'PENDING' && (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => review(c.id, 'approve')} className="rounded-md border border-lime/30 bg-lime/10 px-2 py-1 text-[10px] text-lime">Approve</button>
                          <button onClick={() => review(c.id, 'reject')} className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted hover:text-danger">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
