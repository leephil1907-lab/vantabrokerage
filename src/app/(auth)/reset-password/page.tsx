'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { apiFetch, useToast } from '@/components/ui';

function ResetForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const { push } = useToast();
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { push({ tone: 'error', title: 'Passwords do not match' }); return; }
    setBusy(true);
    try {
      await apiFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
      push({ tone: 'success', title: 'Password updated', body: 'All existing sessions were signed out.' });
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) { push({ tone: 'error', title: 'Reset failed', body: (err as Error).message }); }
    finally { setBusy(false); }
  };

  if (!token) return <div className="panel p-6 text-[12.5px] text-danger">This reset link is missing its token. Request a new link from the sign-in page.</div>;

  return (
    <div className="panel p-6">
      <h1 className="text-lg font-semibold text-white">Choose a new password</h1>
      {done ? (
        <p className="mt-3 text-[12.5px] text-emerald">Password updated. Redirecting to sign in…</p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block"><span className="label">New password</span><input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field mt-1.5" /></label>
          <label className="block"><span className="label">Confirm password</span><input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="field mt-1.5" /></label>
          <button disabled={busy || password.length < 10} className="btn-primary w-full py-2.5 text-[13px]">{busy ? 'Updating…' : 'Update password'}</button>
          <Link href="/login" className="block text-center text-[12px] text-muted hover:text-white">Back to sign in</Link>
        </form>
      )}
    </div>
  );
}

export default function ResetPage() {
  return <Suspense fallback={<div className="panel h-72 animate-pulse" />}><ResetForm /></Suspense>;
}
