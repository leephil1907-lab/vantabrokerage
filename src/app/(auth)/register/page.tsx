'use client';

import { Select } from '@/components/ui/select';
import { COUNTRIES } from '@/lib/countries';
import { MaskLine } from '@/components/motion/primitives';
import Link from 'next/link';
import { ArrowUpRight } from '@/components/ui/arrow-up-right';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { apiFetch, useToast } from '@/components/ui';
import { AuthError, AuthField, PasswordField } from '@/components/auth/fields';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', country: 'Nigeria', phone: '', referralCode: params.get('ref') ?? '', acceptTerms: false });
  const [referralOpen] = useState(Boolean(params.get('ref')));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { push } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (form.password.length < 10 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError('Choose a password with at least 10 characters, including a letter and a number.'); return;
    }
    setBusy(true); setError(null);
    try {
      const res = await apiFetch<{ emailDelivery: { delivered: boolean } }>('/api/auth/register', { method: 'POST', body: JSON.stringify(form) });
      push({ tone: res.emailDelivery.delivered ? 'success' : 'error', title: 'Account created', body: res.emailDelivery.delivered ? 'Check your inbox to verify your email.' : 'Email delivery is unavailable. Contact support to verify your account.' });
      router.push('/dashboard'); router.refresh();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  return <div>
    <p className="auth-form-kicker">Start your journey</p>
    <h1 className="auth-title"><MaskLine>Create your account.</MaskLine></h1>
    <p className="auth-subtitle">A considered space for your account and the markets you follow.</p>
    <form onSubmit={submit} className="auth-form">
      <div className="auth-row">
        <AuthField id="first-name" label="First name" required maxLength={60} autoComplete="given-name" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <AuthField id="last-name" label="Last name" required maxLength={60} autoComplete="family-name" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
      </div>
      <AuthField id="register-email" label="Email address" required maxLength={254} type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <PasswordField id="register-password" label="Create password" required minLength={10} maxLength={128} autoComplete="new-password" placeholder="Create a password" hint="At least 10 characters, including a letter and a number." aria-describedby="register-password-hint" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <Select id="register-country" label="Country of residence" value={form.country} onChange={(v) => setForm({ ...form, country: v })} options={COUNTRIES.map((c) => ({ value: c, label: c }))} placeholder="Select country…" />
      <details className="auth-options" open={referralOpen || undefined}>
        <summary>Additional details <span className="auth-label-note">(optional)</span></summary>
        <div className="auth-options-content">
          <AuthField id="phone" label="Phone number" note="(optional)" type="tel" maxLength={32} autoComplete="tel" placeholder="Your phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <AuthField id="referral" label="Referral code" note="(optional)" maxLength={32} autoCapitalize="characters" placeholder="Enter code" value={form.referralCode} onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })} />
        </div>
      </details>
      <label className="auth-consent"><input type="checkbox" required checked={form.acceptTerms} onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })} /><span>I agree to the <Link href="/legal/terms">terms</Link>, <Link href="/legal/privacy">privacy policy</Link> and <Link href="/legal/risk-disclosure">risk disclosure</Link>.</span></label>
      <AuthError message={error} />
      <button type="submit" disabled={busy} className="auth-submit">{busy ? 'Creating account…' : <>Create account <ArrowUpRight /></>}</button>
    </form>
    <p className="auth-switch">Already have an account? <Link href="/login">Sign in <ArrowUpRight /></Link></p>
  </div>;
}

export default function RegisterPage() {
  return <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white/[.03]" />}><RegisterForm /></Suspense>;
}
