'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, useToast, Badge, ConfirmButton } from '@/components/ui';

type User = { id: string; email: string; role: string; status: string; emailVerified: boolean; referralCode: string; createdAt: string; profile: { firstName: string | null; lastName: string | null; phone: string | null; country: string | null; address: string | null; city: string | null; postalCode: string | null; timezone: string | null } | null; kycStatus: string };

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', country: '', address: '', city: '', postalCode: '', timezone: 'UTC' });
  const [busy, setBusy] = useState(false);
  const { push } = useToast();
  const router = useRouter();

  useEffect(() => {
    apiFetch<{ user: User }>('/api/profile').then((b) => {
      setUser(b.user);
      setForm({
        firstName: b.user.profile?.firstName ?? '', lastName: b.user.profile?.lastName ?? '', phone: b.user.profile?.phone ?? '',
        country: b.user.profile?.country ?? '', address: b.user.profile?.address ?? '', city: b.user.profile?.city ?? '',
        postalCode: b.user.profile?.postalCode ?? '', timezone: b.user.profile?.timezone ?? 'UTC',
      });
    }).catch(() => undefined);
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      await apiFetch('/api/profile', { method: 'PATCH', body: JSON.stringify(form) });
      push({ tone: 'success', title: 'Profile updated' });
    } catch (e) { push({ tone: 'error', title: 'Save failed', body: (e as Error).message }); }
    finally { setBusy(false); }
  };

  const deleteAccount = async () => {
    try {
      await apiFetch('/api/profile', { method: 'PATCH', body: JSON.stringify({ preferences: { deletionRequested: true } }) });
      push({ tone: 'info', title: 'Deletion request recorded', body: 'Support will confirm the closure of your account by email.' });
    } catch (e) { push({ tone: 'error', title: 'Request failed', body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="mt-0.5 text-[12px] text-muted">Profile details, account information and data requests.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className="panel p-4">
          <p className="text-[13px] font-semibold text-white">Profile</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="label">First name</span><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="field mt-1.5" /></label>
            <label className="block"><span className="label">Last name</span><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="field mt-1.5" /></label>
            <label className="block"><span className="label">Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field mt-1.5" /></label>
            <label className="block"><span className="label">Country</span><input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="field mt-1.5" /></label>
            <label className="block sm:col-span-2"><span className="label">Address</span><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="field mt-1.5" /></label>
            <label className="block"><span className="label">City</span><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="field mt-1.5" /></label>
            <label className="block"><span className="label">Postal code</span><input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="field mt-1.5" /></label>
            <label className="block sm:col-span-2">
              <span className="label">Timezone</span>
              <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="field mt-1.5">
                {['UTC', 'Africa/Lagos', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'Asia/Dubai', 'Asia/Singapore'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
          <button onClick={save} disabled={busy} className="btn-primary mt-3 w-full py-2 text-[12.5px]">{busy ? 'Saving…' : 'Save changes'}</button>
        </section>

        <div className="space-y-4">
          <section className="panel p-4">
            <p className="text-[13px] font-semibold text-white">Account</p>
            <dl className="mt-3 space-y-2 text-[11.5px]">
              {[
                ['Email', user?.email ?? '—'],
                ['Status', user?.status ?? '—'],
                ['Role', user?.role ?? '—'],
                ['Referral code', user?.referralCode ?? '—'],
                ['Member since', user ? new Date(user.createdAt).toLocaleDateString('en-GB') : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="text-right text-white">{v}</dd></div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {user && (user.emailVerified ? <Badge tone="green">email verified</Badge> : <Badge tone="amber">email unverified</Badge>)}
              {user && <Badge tone={user.kycStatus === 'APPROVED' ? 'green' : 'gray'}>kyc {user.kycStatus.toLowerCase().replace('_', ' ')}</Badge>}
            </div>
          </section>

          <section className="panel p-4">
            <p className="text-[13px] font-semibold text-white">Data & account closure</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
              You can request a copy of your data or the closure of your account. Closure requires zero balances and no open positions.
            </p>
            <div className="mt-3 grid gap-2">
              <button
                onClick={async () => {
                  const res = await fetch('/api/portfolio').then((r) => r.json()).catch(() => null);
                  const blob = new Blob([JSON.stringify(res ?? {}, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'primevest-portfolio-export.json'; a.click();
                  URL.revokeObjectURL(url);
                  push({ tone: 'success', title: 'Portfolio exported' });
                }}
                className="btn-ghost py-2 text-[12px]"
              >
                Download portfolio data
              </button>
              <ConfirmButton
                onConfirm={deleteAccount}
                title="Request account closure"
                description="Support will verify your balances and confirm by email before closing the account."
                confirmLabel="Request closure"
                tone="danger"
                className="btn-ghost py-2 text-[12px]"
              >
                Request account closure
              </ConfirmButton>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
