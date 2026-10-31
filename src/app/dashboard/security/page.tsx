'use client';

import { useEffect, useState } from 'react';
import { Badge, apiFetch, useToast, Modal } from '@/components/ui';
import { fmtTime, relTime } from '@/lib/format';

type Session = { id: string; device: string | null; ip: string | null; createdAt: string; lastSeenAt: string; expiresAt: string; current: boolean };

export default function SecurityPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [twoFactor, setTwoFactor] = useState(false);
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = useState('');
  const [pwd, setPwd] = useState({ current: '', next: '' });
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableForm, setDisableForm] = useState({ password: '', code: '' });
  const { push } = useToast();

  const load = () => {
    apiFetch<{ sessions: Session[] }>('/api/auth/sessions').then((b) => setSessions(b.sessions)).catch(() => undefined);
    apiFetch<{ user: { twoFactorEnabled: boolean } }>('/api/profile').then((b) => setTwoFactor(b.user.twoFactorEnabled)).catch(() => undefined);
  };
  useEffect(() => { load(); }, []);

  const start2fa = async () => {
    try {
      const res = await apiFetch<{ secret: string; qr: string }>('/api/auth/2fa/setup', { method: 'POST' });
      setSetup(res);
    } catch (e) { push({ tone: 'error', title: 'Could not start setup', body: (e as Error).message }); }
  };

  const enable2fa = async () => {
    try {
      await apiFetch('/api/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) });
      push({ tone: 'success', title: 'Two-factor enabled', body: 'You will be asked for a code at sign-in and on withdrawals.' });
      setSetup(null); setCode(''); load();
    } catch (e) { push({ tone: 'error', title: 'Invalid code', body: (e as Error).message }); }
  };

  const disable2fa = async () => {
    try {
      await apiFetch('/api/auth/2fa/disable', { method: 'POST', body: JSON.stringify(disableForm) });
      push({ tone: 'success', title: 'Two-factor disabled' });
      setDisableOpen(false); setDisableForm({ password: '', code: '' }); load();
    } catch (e) { push({ tone: 'error', title: 'Could not disable', body: (e as Error).message }); }
  };

  const changePassword = async () => {
    try {
      await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }) });
      push({ tone: 'success', title: 'Password updated', body: 'Other sessions were signed out.' });
      setPwd({ current: '', next: '' }); load();
    } catch (e) { push({ tone: 'error', title: 'Password change failed', body: (e as Error).message }); }
  };

  const revoke = async (s: Session) => {
    try {
      await apiFetch(`/api/auth/sessions?id=${s.id}`, { method: 'DELETE' });
      push({ tone: 'success', title: 'Session revoked' });
      load();
    } catch (e) { push({ tone: 'error', title: 'Could not revoke', body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Security</h1>
        <p className="mt-0.5 text-[12px] text-muted">Two-factor authentication, password management and active session control.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-white">Two-factor authentication</p>
            {twoFactor ? <Badge tone="green">enabled</Badge> : <Badge tone="amber">not enabled</Badge>}
          </div>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
            Protects sign-in and withdrawal authorisation with a TOTP code from your authenticator app.
          </p>
          {setup ? (
            <div className="mt-3 space-y-3">
              <img src={setup.qr} alt="Authenticator QR code" className="mx-auto h-40 w-40 rounded-xl border border-white/10 bg-white p-1.5" />
              <div className="rounded-lg border border-white/[0.07] bg-ink-900/60 p-2.5">
                <p className="label">Manual entry key</p>
                <p className="value-mono mt-0.5 break-all text-[11.5px] text-white">{setup.secret}</p>
              </div>
              <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} inputMode="numeric" placeholder="6-digit code" className="field text-center font-mono tracking-[0.4em]" />
              <button onClick={enable2fa} disabled={code.length !== 6} className="btn-primary w-full py-2 text-[12.5px]">Confirm and enable</button>
            </div>
          ) : twoFactor ? (
            <button onClick={() => setDisableOpen(true)} className="btn-ghost mt-3 w-full py-2 text-[12.5px]">Disable two-factor</button>
          ) : (
            <button onClick={start2fa} className="btn-primary mt-3 w-full py-2 text-[12.5px]">Set up two-factor</button>
          )}
        </section>

        <section className="panel p-4">
          <p className="text-[13px] font-semibold text-white">Change password</p>
          <p className="mt-1.5 text-[11.5px] text-muted">Minimum 10 characters with at least one letter and one number. Other sessions are signed out.</p>
          <div className="mt-3 space-y-2.5">
            <input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} placeholder="Current password" className="field" />
            <input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} placeholder="New password" className="field" />
            <button onClick={changePassword} disabled={!pwd.current || pwd.next.length < 10} className="btn-primary w-full py-2 text-[12.5px]">Update password</button>
          </div>
        </section>
      </div>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
          <p className="text-[13px] font-semibold text-white">Active sessions</p>
          <span className="text-[10.5px] text-muted">{sessions.length} sessions</span>
        </div>
        <table className="w-full">
          <thead><tr><th className="th">Device</th><th className="th">IP</th><th className="th">Started</th><th className="th">Last seen</th><th className="th">Expires</th><th className="th"></th></tr></thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="table-row">
                <td className="td">{s.device ?? 'Unknown device'} {s.current && <Badge tone="lime">this device</Badge>}</td>
                <td className="td value-mono text-[11px] text-muted">{s.ip ?? '—'}</td>
                <td className="td text-[11px] text-muted">{fmtTime(s.createdAt)}</td>
                <td className="td text-[11px] text-muted">{relTime(s.lastSeenAt)}</td>
                <td className="td text-[11px] text-muted">{fmtTime(s.expiresAt)}</td>
                <td className="td text-right">
                  {!s.current && <button onClick={() => revoke(s)} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-muted hover:border-danger/40 hover:text-danger">Revoke</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        title="Disable two-factor authentication"
        description="Confirm with your password and a current authenticator code."
        footer={<><button className="btn-ghost" onClick={() => setDisableOpen(false)}>Cancel</button><button className="btn-danger" onClick={disable2fa} disabled={!disableForm.password || disableForm.code.length !== 6}>Disable</button></>}
      >
        <div className="space-y-2.5">
          <input type="password" value={disableForm.password} onChange={(e) => setDisableForm({ ...disableForm, password: e.target.value })} placeholder="Account password" className="field" />
          <input value={disableForm.code} onChange={(e) => setDisableForm({ ...disableForm, code: e.target.value })} maxLength={6} placeholder="6-digit code" className="field text-center font-mono tracking-[0.4em]" />
        </div>
      </Modal>
    </div>
  );
}
