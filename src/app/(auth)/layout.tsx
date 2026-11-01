import Link from 'next/link';
import { Logo } from '@/components/brand';
import { ToastProvider } from '@/components/ui';
import { PageTransition } from '@/components/motion/page-transition';
import { ThemeToggle } from '@/components/theme-toggle';
import './auth.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="auth-layout">
        <header className="auth-header">
          <Logo size={34} />
          <div className="flex items-center gap-4"><ThemeToggle /><Link href="/" className="auth-back"><span aria-hidden="true">←</span> Back to website</Link></div>
        </header>
        <div className="auth-grid">
          <aside className="auth-story" aria-label="About PRIMEVEST">
            <div className="auth-story-image" />
            <div className="auth-story-overlay" />
            <div className="auth-story-content">
              <div><p className="auth-story-eyebrow"><span /> THE PRIMEVEST EXPERIENCE</p>
                <h2>A clearer view.<br /><em>A better perspective.</em></h2>
                <p className="auth-story-description">A considered space to follow global markets and manage your account with confidence.</p>
              </div>
              <div className="auth-story-bottom">
                <div className="auth-story-divider" />
                <p>MARKET INFORMATION <span> / </span> ACCOUNT WORKSPACE</p>
                <small>Conceptual imagery · Market prices are for reference.</small>
              </div>
            </div>
          </aside>
          <main id="main-content" tabIndex={-1} className="auth-main">
            <div className="auth-main-inner"><PageTransition>{children}</PageTransition></div>
            <footer className="auth-footer"><span>© {new Date().getFullYear()} PRIMEVEST</span><span>Market data is for reference.</span></footer>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
