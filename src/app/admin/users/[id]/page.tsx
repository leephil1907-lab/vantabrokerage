'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Badge, StatusBadge, apiFetch, useToast } from '@/components/ui';
import { fmtMoney, fmtPrice, fmtSigned, relTime } from '@/lib/format';

export default function AdminUserDetail() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const { push } = useToast();

  const load = useCallback(() => apiFetch(`/api/admin/users/${params.id}`).then(setData).catch((e) => push({ tone: 'error', title: 'Load failed', body: e.message })), [params.id, push]);
  useEffect(() => { load(); }, [load]);

  const patch = async (body: Record<string, unknown>) => {
    try {
      await apiFetch(`/api/admin/users/${params.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      push({ tone: 'success', title: 'User updated' });
      load();
    } catch (e) { push({ tone: 'error', title: 'Update failed', body: (e as Error).message }); }
  };

  if (!data) return <div className="panel p-8 text-center text-[12px] text-muted">Loading user…</div>;
  const u = data.user;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/users" className="text-[11.5px] text-muted hover:text-white">← Back to users</Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">{u.email}</h1>
          <p className="mt-0.5 text-[12px] text-muted">
            {u.profile?.firstName} {u.profile?.lastName} · {u.profile?.country ?? '—'} · joined {new Date(u.createdAt).toLocaleDateString('en-GB')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={u.status} />
          <Badge tone={u.kyc?.status === 'APPROVED' ? 'green' : 'amber'}>{u.kyc?.status ?? 'NOT_SUBMITTED'}</Badge>
          <select value={u.status} onChange={(e) => patch({ status: e.target.value })} className="field-sm w-32">
            {['PENDING', 'ACTIVE', 'RESTRICTED', 'SUSPENDED', 'CLOSED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={u.role} onChange={(e) => patch({ role: e.target.value })} className="field-sm w-32">
            {['USER', 'SUPPORT', 'FINANCE', 'ADMIN', 'SUPERADMIN'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {u.accounts.map((a: any) => (
          <div key={a.id} className="panel p-4">
            <p className="label">{a.type} account</p>
            <p className="value-mono mt-1 text-lg font-semibold text-white">{fmtMoney(a.available)}</p>
            <p className="text-[10.5px] text-muted">{fmtMoney(a.locked)} locked · {a.leverage}× max leverage</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel overflow-hidden">
          <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-[13px] font-semibold text-white">Positions & orders</p></div>
          <table className="w-full">
            <thead><tr><th className="th">Market</th><th className="th">Type</th><th className="th text-right">Qty</th><th className="th">Status</th><th className="th text-right">Realised</th></tr></thead>
            <tbody>
              {data.activity.positions.map((p: any) => (
                <tr key={p.id} className="table-row">
                  <td className="td text-white">{p.symbol} {p.side}</td>
                  <td className="td text-[11px] text-muted">position</td>
                  <td className="td text-right value-mono">{p.qty}</td>
                  <td className="td"><StatusBadge status={p.status} /></td>
                  <td className="td text-right value-mono">{fmtSigned(p.realizedPnl)}</td>
                </tr>
              ))}
              {data.activity.orders.map((o: any) => (
                <tr key={o.id} className="table-row">
                  <td className="td text-white">{o.symbol} {o.side}</td>
                  <td className="td text-[11px] text-muted">{o.type}</td>
                  <td className="td text-right value-mono">{o.qty}</td>
                  <td className="td"><StatusBadge status={o.status} /></td>
                  <td className="td text-right text-[11px] text-muted">{relTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-[13px] font-semibold text-white">Wallet activity</p></div>
          <table className="w-full">
            <thead><tr><th className="th">Type</th><th className="th text-right">Amount</th><th className="th">Status</th><th className="th">When</th></tr></thead>
            <tbody>
              {data.activity.deposits.map((d: any) => (
                <tr key={d.id} className="table-row"><td className="td text-[11.5px] text-white">Deposit · {d.asset}</td><td className="td text-right value-mono">{fmtMoney(d.amount)}</td><td className="td"><StatusBadge status={d.status} /></td><td className="td text-[11px] text-muted">{relTime(d.createdAt)}</td></tr>
              ))}
              {data.activity.withdrawals.map((w: any) => (
                <tr key={w.id} className="table-row"><td className="td text-[11.5px] text-white">Withdrawal · {w.asset}</td><td className="td text-right value-mono">{fmtMoney(w.amount)}</td><td className="td"><StatusBadge status={w.status} /></td><td className="td text-[11px] text-muted">{relTime(w.createdAt)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="panel overflow-hidden">
        <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-[13px] font-semibold text-white">Ledger (read-only)</p></div>
        <p className="border-b border-white/[0.07] px-4 py-2 text-[10.5px] text-muted">
          Administrators cannot edit balances. Corrections require a new audited ledger transaction; this view is read-only by design.
        </p>
        <table className="w-full">
          <thead><tr><th className="th">Type</th><th className="th">Description</th><th className="th text-right">Amount</th><th className="th">Direction</th><th className="th">When</th></tr></thead>
          <tbody>
            {data.activity.ledger.map((e: any) => (
              <tr key={e.id} className="table-row">
                <td className="td text-[11.5px] text-white">{e.type.replace(/_/g, ' ')}</td>
                <td className="td text-[11px] text-muted">{e.description ?? '—'}</td>
                <td className="td text-right value-mono">{fmtMoney(e.amount)}</td>
                <td className="td text-[11px] text-muted">{e.direction}</td>
                <td className="td text-[11px] text-muted">{relTime(e.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-[13px] font-semibold text-white">Active sessions</p></div>
        <table className="w-full">
          <thead><tr><th className="th">Device</th><th className="th">IP</th><th className="th">Last seen</th></tr></thead>
          <tbody>
            {u.sessions.map((s: any) => (
              <tr key={s.id} className="table-row"><td className="td text-[11.5px] text-white">{s.device}</td><td className="td value-mono text-[11px] text-muted">{s.ip}</td><td className="td text-[11px] text-muted">{relTime(s.lastSeenAt)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
