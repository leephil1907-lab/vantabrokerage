'use client';

import { MaskLine } from '@/components/motion/primitives';
import Link from 'next/link';
import { ArrowUpRight } from '@/components/ui/arrow-up-right';
import { useState } from 'react';
import { apiFetch } from '@/components/ui';
import { AuthError, AuthField } from '@/components/auth/fields';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return;
    setBusy(true); setError(null);
    try { await apiFetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); setSent(true); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  return <div>
    <p className="auth-form-kicker">Account security</p><h1 className="auth-title"><MaskLine>Reset your password.</MaskLine></h1>
    <p className="auth-subtitle">Enter the email associated with your account to request a reset link.</p>
    {sent ? <div className="auth-form"><div role="status" className="rounded-xl border border-emerald/25 bg-emerald/10 p-4 text-sm leading-relaxed text-white/80">If an account exists for this email, a reset link will be sent if email delivery is available. Check your inbox and spam folder.</div><Link href="/login" className="auth-submit">Back to sign in <ArrowUpRight /></Link></div>
      : <form onSubmit={submit} className="auth-form"><AuthField id="reset-email" label="Email address" required type="email" autoComplete="email" autoCapitalize="none" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /><AuthError message={error} /><button disabled={busy} className="auth-submit">{busy ? 'Sending…' : <>Send reset link <ArrowUpRight /></>}</button></form>}
    <p className="auth-switch">Remembered your password? <Link href="/login">Sign in ↗</Link></p>
  </div>;
}
