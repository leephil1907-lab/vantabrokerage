'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiFetch, useToast } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch<{ ok: boolean }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setSent(true);
      push({ tone: 'success', title: 'Request received', body: 'If the account exists, check your inbox for a reset link.' });
    } catch (err) { push({ tone: 'error', title: 'Request failed', body: (err as Error).message }); }
    finally { setBusy(false); }
  };

  return (
    <div className="panel p-6">
      <h1 className="text-lg font-semibold text-white">Reset your password</h1>
      <p className="mt-1 text-[12.5px] text-muted">We will send a one-hour reset link to your registered email.</p>
      {sent ? (
        <div className="mt-4 space-y-3">
          <p className="rounded-lg border border-emerald/25 bg-emerald/10 px-3 py-2 text-[11.5px] text-emerald">If an account exists for {email}, you will receive a reset link if email delivery is available.</p>
          <Link href="/login" className="block text-center text-[12px] text-muted hover:text-white">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block"><span className="label">Email</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field mt-1.5" /></label>
          <button disabled={busy} className="btn-primary w-full py-2.5 text-[13px]">{busy ? 'Sending…' : 'Send reset link'}</button>
          <Link href="/login" className="block text-center text-[12px] text-muted hover:text-white">Back to sign in</Link>
        </form>
      )}
    </div>
  );
}
