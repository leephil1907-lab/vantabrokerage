'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { apiFetch } from '@/components/ui';

function Verify() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'idle' | 'working' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setState('error'); setMessage('This verification link is missing its token.'); return; }
    setState('working');
    apiFetch('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
      .then(() => setState('ok'))
      .catch((e) => { setState('error'); setMessage(e.message); });
  }, [token]);

  return (
    <div className="panel p-6 text-center">
      <h1 className="text-lg font-semibold text-white">Email verification</h1>
      {state === 'working' && <p className="mt-3 text-[12.5px] text-muted">Verifying your address…</p>}
      {state === 'ok' && <p className="mt-3 text-[12.5px] text-emerald">Your email address is verified.</p>}
      {state === 'error' && <p className="mt-3 text-[12.5px] text-danger">{message}</p>}
      <div className="mt-4 flex flex-col gap-2">
        <Link href="/dashboard" className="btn-primary w-full py-2 text-[12.5px]">Go to dashboard</Link>
        <Link href="/login" className="text-[12px] text-muted hover:text-white">Sign in instead</Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="panel h-56 animate-pulse" />}><Verify /></Suspense>;
}
