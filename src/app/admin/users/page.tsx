'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge, StatusBadge, apiFetch, useToast } from '@/components/ui';
import { fmtMoney, relTime } from '@/lib/format';

type User = { id: string; email: string; role: string; status: string; emailVerified: boolean; createdAt: string; lastLoginAt: string | null; name: string; country: string; kycStatus: string; balances: { type: string; available: number; locked: number }[] };

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const { push } = useToast();

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (status) params.set('status', status);
    apiFetch<{ users: User[] }>(`/api/admin/users?${params}`).then((b) => setUsers(b.users)).catch((e) => push({ tone: 'error', title: 'Load failed', body: e.message }));
  }, [q, status, push]);

  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); }, [load]);

  const setUserStatus = async (u: User, next: string) => {
    try {
      await apiFetch(`/api/admin/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      push({ tone: 'success', title: `User ${next.toLowerCase()}`, body: `${u.email} status updated and audited.` });
      load();
    } catch (e) { push({ tone: 'error', title: 'Update failed', body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">User management</h1>
          <p className="mt-0.5 text-[12px] text-muted">Search, inspect, restrict and suspend client accounts. All changes are audit-logged.</p>
        </div>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email, name or code" className="field-sm w-56" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-sm w-36">
            <option value="">All statuses</option>
            {['PENDING', 'ACTIVE', 'RESTRICTED', 'SUSPENDED', 'CLOSED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead><tr><th className="th">User</th><th className="th">Status</th><th className="th">KYC</th><th className="th">Role</th><th className="th text-right">Balances</th><th className="th">Last login</th><th className="th">Joined</th><th className="th"></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="table-row">
                  <td className="td">
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-white hover:text-lime">{u.email}</Link>
                    <p className="text-[10.5px] text-muted">{u.name} · {u.country} {u.emailVerified ? '' : '· email unverified'}</p>
                  </td>
                  <td className="td"><StatusBadge status={u.status} /></td>
                  <td className="td"><Badge tone={u.kycStatus === 'APPROVED' ? 'green' : u.kycStatus === 'PENDING' ? 'amber' : 'gray'}>{u.kycStatus.replace('_', ' ')}</Badge></td>
                  <td className="td text-[11px] text-muted">{u.role}</td>
                  <td className="td text-right">
                    {u.balances.map((b) => (
                      <p key={b.type} className="value-mono text-[11px] text-white">{b.type}: {fmtMoney(b.available)}{b.locked > 0 ? ` (+${fmtMoney(b.locked)} locked)` : ''}</p>
                    ))}
                  </td>
                  <td className="td text-[11px] text-muted">{u.lastLoginAt ? relTime(u.lastLoginAt) : 'never'}</td>
                  <td className="td text-[11px] text-muted">{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                  <td className="td text-right">
                    <div className="flex justify-end gap-1">
                      {u.status !== 'SUSPENDED' && <button onClick={() => setUserStatus(u, 'SUSPENDED')} className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted hover:border-danger/40 hover:text-danger">Suspend</button>}
                      {u.status === 'SUSPENDED' && <button onClick={() => setUserStatus(u, 'ACTIVE')} className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted hover:text-white">Reinstate</button>}
                      {u.status === 'ACTIVE' && <button onClick={() => setUserStatus(u, 'RESTRICTED')} className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted hover:text-siren">Restrict</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
