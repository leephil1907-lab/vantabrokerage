'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, apiFetch } from '@/components/ui';
import { fmtMoney, fmtQty, relTime } from '@/lib/format';

type Stats = {
  totals: { users: number; activeUsers: number; pendingKyc: number; totalDeposits: number; totalWithdrawals: number; volume: number; fees: number; openPositions: number; orders: number; pendingWithdrawals: number; pendingDeposits: number; openTickets: number };
  health: Record<string, string>;
  recentAudit: { id: string; action: string; targetType: string; targetId: string | null; actor: string; createdAt: string }[];
};

export default function AdminOverview() {
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () => apiFetch<Stats>('/api/admin/stats').then((b) => { setData(b); setError(null); }).catch((e) => setError(e.message));
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, []);

  if (error) return <div className="panel p-6 text-[12.5px] text-danger">Admin API error: {error}</div>;
  if (!data) return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-24" />)}</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Platform overview</h1>
        <p className="mt-0.5 text-[12px] text-muted">Live operational metrics from the database. Figures refresh every 20 seconds.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Registered users" value={String(data.totals.users)} sub={`${data.totals.activeUsers} active in 7d`} />
        <Card label="Pending verification" value={String(data.totals.pendingKyc)} sub="awaiting compliance review" tone={data.totals.pendingKyc > 0 ? 'warn' : undefined} href="/admin/kyc" />
        <Card label="Total deposits credited" value={fmtMoney(data.totals.totalDeposits)} sub={`${data.totals.pendingDeposits} pending review`} href="/admin/wallets" />
        <Card label="Total withdrawals" value={fmtMoney(data.totals.totalWithdrawals)} sub={`${data.totals.pendingWithdrawals} awaiting action`} tone={data.totals.pendingWithdrawals > 0 ? 'warn' : undefined} href="/admin/wallets" />
        <Card label="Trading volume" value={fmtMoney(data.totals.volume)} sub={`${fmtQty(data.totals.orders, 0)} orders`} />
        <Card label="Fees collected" value={fmtMoney(data.totals.fees)} sub="Recorded trading fees" />
        <Card label="Open positions" value={String(data.totals.openPositions)} sub="across all accounts" href="/admin/trading" />
        <Card label="Open support tickets" value={String(data.totals.openTickets)} sub="client enquiries" href="/admin/support" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <p className="text-[13px] font-semibold text-white">Integration health</p>
          <dl className="mt-3 space-y-2 text-[11.5px]">
            {Object.entries(data.health).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <dt className="text-muted">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</dt>
                <dd><Badge tone={v === 'ok' || v === 'live' || v === 'configured' ? 'green' : v === 'not-configured' ? 'gray' : 'lime'}>{v}</Badge></dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
            Unconfigured providers are reported here rather than hidden. Live execution, automated custody payouts and card deposits are not implemented.
          </p>
        </section>

        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <p className="text-[13px] font-semibold text-white">Recent administrative activity</p>
            <Link href="/admin/audit" className="text-[11.5px] text-lime hover:underline">Full audit log</Link>
          </div>
          {data.recentAudit.length === 0 ? (
            <p className="px-4 py-6 text-[11.5px] text-muted">No administrative actions recorded yet.</p>
          ) : (
            <table className="w-full">
              <thead><tr><th className="th">Action</th><th className="th">Target</th><th className="th">Actor</th><th className="th">When</th></tr></thead>
              <tbody>
                {data.recentAudit.map((a) => (
                  <tr key={a.id} className="table-row">
                    <td className="td text-[11.5px] font-medium text-white">{a.action}</td>
                    <td className="td text-[11px] text-muted">{a.targetType}{a.targetId ? ` · ${a.targetId.slice(0, 8)}` : ''}</td>
                    <td className="td text-[11px] text-muted">{a.actor}</td>
                    <td className="td text-[11px] text-muted">{relTime(a.createdAt)}</td>
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

function Card({ label, value, sub, tone, href }: { label: string; value: string; sub?: string; tone?: 'warn'; href?: string }) {
  const body = (
    <div className={`panel p-4 ${tone === 'warn' ? 'border-siren/25 bg-siren/[0.04]' : ''} ${href ? 'transition-colors hover:border-white/20' : ''}`}>
      <p className="label">{label}</p>
      <p className={`value-mono mt-1.5 text-[20px] font-semibold ${tone === 'warn' ? 'text-siren' : 'text-white'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[10.5px] text-muted">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
