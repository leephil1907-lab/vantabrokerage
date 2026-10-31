'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { apiFetch, useToast } from '@/components/ui';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', country: 'Nigeria', phone: '', referralCode: params.get('ref') ?? '', acceptTerms: false });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);
  const { push } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors(null);
    try {
      const res = await apiFetch<{ emailDelivery: { delivered: boolean } }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      push({ tone: res.emailDelivery.delivered ? 'success' : 'error', title: 'Account created', body: res.emailDelivery.delivered ? 'Check your inbox to verify your email.' : 'Email delivery is unavailable. Contact support to verify your account.' });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setErrors((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel p-6">
      <h1 className="text-lg font-semibold tracking-tight text-white">Open your account</h1>
      <p className="mt-1 text-[12.5px] text-muted">Get a live account plus a funded paper account, instantly.</p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="block"><span className="label">First name</span><input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="field mt-1.5" /></label>
          <label className="block"><span className="label">Last name</span><input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="field mt-1.5" /></label>
        </div>
        <label className="block"><span className="label">Email</span><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field mt-1.5" autoComplete="email" /></label>
        <label className="block"><span className="label">Password</span><input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="field mt-1.5" autoComplete="new-password" placeholder="10+ characters, letters and numbers" /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block"><span className="label">Country</span><input required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="field mt-1.5" /></label>
          <label className="block"><span className="label">Phone (optional)</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field mt-1.5" /></label>
        </div>
        <label className="block"><span className="label">Referral code (optional)</span><input value={form.referralCode} onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })} className="field mt-1.5" /></label>
        <label className="flex items-start gap-2 text-[11.5px] leading-relaxed text-muted">
          <input type="checkbox" checked={form.acceptTerms} onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })} className="mt-0.5 h-3.5 w-3.5 accent-lime" />
          <span>I accept the <Link href="/legal/terms" className="link">terms</Link>, <Link href="/legal/privacy" className="link">privacy policy</Link> and <Link href="/legal/risk-disclosure" className="link">risk disclosure</Link>.</span>
        </label>
        {errors && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[11.5px] text-danger">{errors}</p>}
        <button type="submit" disabled={busy || !form.acceptTerms} className="btn-primary w-full py-2.5 text-[13px]">{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="mt-3 text-center text-[12px] text-muted">Already registered? <Link href="/login" className="link">Sign in</Link></p>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={<div className="panel h-96 animate-pulse" />}><RegisterForm /></Suspense>;
}
