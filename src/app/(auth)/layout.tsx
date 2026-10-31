import Link from 'next/link';
import { Logo } from '@/components/brand';
import { ToastProvider } from '@/components/ui';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="relative flex min-h-screen flex-col">
        <div className="pointer-events-none absolute inset-0 grid-faint opacity-60" />
        <header className="relative z-10 mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5">
          <Logo />
          <Link href="/" className="text-[12.5px] text-muted transition hover:text-white">← Back to site</Link>
        </header>
        <main id="main-content" tabIndex={-1} className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
        <footer className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-8 text-center text-[10.5px] leading-relaxed text-muted">
          Trading forex, CFDs and crypto derivatives carries a high risk of loss. This platform may operate with paper trading where execution providers are not connected.
        </footer>
      </div>
    </ToastProvider>
  );
}
