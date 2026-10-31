import Link from 'next/link';
import { Logo } from '@/components/brand';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
      <Logo />
      <div>
        <p className="value-mono text-[11px] uppercase tracking-[0.3em] text-muted">error 404</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">This page does not exist</h1>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted">
          The link may be outdated. Head back to the markets, your dashboard, or sign in to continue.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn-ghost px-4 py-2 text-[13px]">Home</Link>
        <Link href="/markets" className="btn-ghost px-4 py-2 text-[13px]">Markets</Link>
        <Link href="/dashboard" className="btn-primary px-4 py-2 text-[13px]">Dashboard</Link>
      </div>
    </div>
  );
}
