'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { apiFetch, useToast } from '@/components/ui';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';
  const [form, setForm] = useState({ email: '', password: '', totp: '' });
  const [needs2fa, setNeeds2fa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(form) });
      push({ tone: 'success', title: 'Signed in' });
      router.push(next);
      router.refresh();
    } catch (err) {
      const e2 = err as Error & { code?: string };
      if (e2.code === 'TWO_FACTOR_REQUIRED' || e2.code === 'INVALID_TWO_FACTOR') setNeeds2fa(true);
      setError(e2.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="panel p-6">
      <h1 className="text-lg font-semibold tracking-tight text-white">Sign in</h1>
      <p className="mt-1 text-[12.5px] text-muted">Access your dashboard, terminals and wallet.</p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="block"><span className="label">Email</span><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field mt-1.5" autoComplete="email" /></label>
        <label className="block"><span className="label">Password</span><input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="field mt-1.5" autoComplete="current-password" /></label>
        {needs2fa && (
          <label className="block">
            <span className="label">Authenticator code</span>
            <input value={form.totp} onChange={(e) => setForm({ ...form, totp: e.target.value })} maxLength={6} inputMode="numeric" className="field mt-1.5 text-center font-mono tracking-[0.4em]" placeholder="123456" />
          </label>
        )}
        {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[11.5px] text-danger">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 text-[13px]">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <div className="mt-3 flex items-center justify-between text-[12px]">
        <Link href="/forgot-password" className="link">Forgot password?</Link>
        <Link href="/register" className="text-muted hover:text-white">Create account</Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="panel h-80 animate-pulse" />}><LoginForm /></Suspense>;
}
