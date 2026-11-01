'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/components/ui';
import { AuthError } from '@/components/auth/fields';

function Verify() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<'working' | 'ok' | 'error'>('working');
  const [message, setMessage] = useState('');
  const verification = useRef<{ token: string; promise: Promise<unknown> } | null>(null);
  useEffect(() => {
    if (!token) { setState('error'); setMessage('This verification link is missing its token.'); return; }
    let active = true;
    if (verification.current?.token !== token) verification.current = { token, promise: apiFetch('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }) };
    verification.current.promise.then(() => { if (active) setState('ok'); }).catch((e) => { if (active) { setState('error'); setMessage(e.message); } });
    return () => { active = false; };
  }, [token]);
  return <div>
    <p className="auth-form-kicker">Account security</p><h1 className="auth-title">Email verification.</h1>
    <div className="auth-form" aria-live="polite">
      {state === 'working' && <p className="auth-subtitle">Verifying your address…</p>}
      {state === 'ok' && <div role="status" className="rounded-xl border border-emerald/25 bg-emerald/10 p-4 text-sm leading-relaxed text-white/80">Your email address is verified.</div>}
      {state === 'error' && <AuthError message={message} />}
      <Link href="/dashboard" className="auth-submit">Go to dashboard <span aria-hidden="true">↗</span></Link>
    </div>
    <p className="auth-switch"><Link href="/login">Back to sign in ↗</Link></p>
  </div>;
}
export default function VerifyEmailPage() { return <Suspense fallback={<div className="h-56 animate-pulse rounded-2xl bg-white/[.03]" />}><Verify /></Suspense>; }
