'use client';

import { MaskLine } from '@/components/motion/primitives';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { apiFetch, useToast } from '@/components/ui';
import { AuthError, AuthField, PasswordField } from '@/components/auth/fields';

/** Return only same-origin relative paths; never use a query string as an external redirect. */
function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\u0000-\u001f]/.test(value)) return '/dashboard';
  try {
    const url = new URL(value, 'https://primevest.invalid');
    return url.origin === 'https://primevest.invalid' ? `${url.pathname}${url.search}${url.hash}` : '/dashboard';
  } catch { return '/dashboard'; }
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '', totp: '' });
  const [needs2fa, setNeeds2fa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    try {
      await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(form) });
      push({ tone: 'success', title: 'Signed in' });
      router.push(safeNext(params.get('next')));
      router.refresh();
    } catch (err) {
      const e2 = err as Error & { code?: string };
      if (e2.code === 'TWO_FACTOR_REQUIRED' || e2.code === 'INVALID_TWO_FACTOR') setNeeds2fa(true);
      setError(e2.message);
    } finally { setBusy(false); }
  };

  return <div>
    <p className="auth-form-kicker">Your PRIMEVEST account</p>
    <h1 className="auth-title"><MaskLine>Welcome back.</MaskLine></h1>
    <p className="auth-subtitle">Sign in to access your account and market workspace.</p>
    <form onSubmit={submit} className="auth-form">
      <AuthField id="login-email" label="Email address" required type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <PasswordField id="login-password" label="Password" required autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} trailing={<Link href="/forgot-password" className="auth-inline-link text-xs">Forgot password?</Link>} />
      {needs2fa && <AuthField id="login-totp" label="Authenticator code" hint="Enter the 6-digit code from your authenticator app." value={form.totp} onChange={(e) => setForm({ ...form, totp: e.target.value.replace(/\D/g, '').slice(0, 6) })} required minLength={6} maxLength={6} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" />}
      <AuthError message={error} />
      <button type="submit" disabled={busy} className="auth-submit">{busy ? 'Signing in…' : <>Sign in <span aria-hidden="true">↗</span></>}</button>
    </form>
    <p className="auth-switch">New to PRIMEVEST? <Link href="/register">Create an account <span aria-hidden="true">↗</span></Link></p>
  </div>;
}

export default function LoginPage() {
  return <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-white/[.03]" />}><LoginForm /></Suspense>;
}
