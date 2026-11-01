'use client';

import { MaskLine } from '@/components/motion/primitives';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { apiFetch } from '@/components/ui';
import { AuthError, PasswordField } from '@/components/auth/fields';

function ResetForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return;
    if (password !== confirm) { setError('Passwords do not match. Please try again.'); return; }
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) { setError('Choose a password with at least 10 characters, including a letter and a number.'); return; }
    setBusy(true); setError(null);
    try { await apiFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }); setDone(true); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  return <div>
    <p className="auth-form-kicker">Account security</p><h1 className="auth-title"><MaskLine>Choose a new password.</MaskLine></h1>
    <p className="auth-subtitle">Keep your account secure with a password you don’t use elsewhere.</p>
    {!token ? <div className="auth-form"><AuthError message="This reset link is missing its token. Please request a new link." /><Link href="/forgot-password" className="auth-submit">Request a new link ↗</Link></div>
      : done ? <div className="auth-form"><div role="status" className="rounded-xl border border-emerald/25 bg-emerald/10 p-4 text-sm leading-relaxed text-white/80">Your password has been updated. Existing sessions have been signed out.</div><Link href="/login" className="auth-submit">Continue to sign in ↗</Link></div>
      : <form onSubmit={submit} className="auth-form">
        <PasswordField id="new-password" label="New password" required minLength={10} maxLength={128} autoComplete="new-password" hint="At least 10 characters, including a letter and a number." aria-describedby="new-password-hint" value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordField id="confirm-password" label="Confirm password" required minLength={10} maxLength={128} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <AuthError message={error} /><button disabled={busy} className="auth-submit">{busy ? 'Updating…' : <>Update password <span aria-hidden="true">↗</span></>}</button>
      </form>}
    <p className="auth-switch"><Link href="/login">Back to sign in ↗</Link></p>
  </div>;
}

export default function ResetPage() { return <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-white/[.03]" />}><ResetForm /></Suspense>; }
