import Link from 'next/link';
import { PageHero, Section, CTASection } from '@/components/marketing-ui';

export const metadata = { title: 'Help center' };

const TOPICS = [
  { title: 'Getting started', items: [
    ['How do I create an account?', 'Use the registration form. You receive a live account and a paper account immediately, along with a verification email.'],
    ['What is the paper account?', 'A simulated account funded on registration. It uses the same terminals and engine but with simulated balances, labelled PAPER throughout.'],
    ['Do I need to deposit to start?', 'No. You can explore every terminal with your paper balance before funding a live account.'],
  ]},
  { title: 'Trading', items: [
    ['Which order types are supported?', 'Market, limit, stop, stop-market, take-profit and take-profit-market, with optional take-profit and stop-loss attachments.'],
    ['How is liquidation price calculated?', 'Entry × (1 ∓ (1 ÷ leverage − 0.005)). The risk engine liquidates when margin ratio falls below 50% of maintenance.'],
    ['When does funding settle?', 'Every eight hours by the background worker, using a bounded rate derived from the 24-hour premium.'],
    ['Why was my order rejected?', 'Most rejections are insufficient margin, quantity below the instrument minimum, or a disabled market. The reason is shown in the order row.'],
  ]},
  { title: 'Wallet & funding', items: [
    ['How are deposits credited?', 'Crypto deposits are verified on-chain through a configured provider, then credited by finance. Without a provider they queue for manual review.'],
    ['Why is my withdrawal pending?', 'Withdrawals need approved identity verification and finance authorisation. Funds are reserved from your balance the moment you submit.'],
    ['Can I lose reserved funds if a withdrawal is rejected?', 'No. A rejection releases the reservation back to your available balance automatically.'],
  ]},
  { title: 'Security', items: [
    ['How do I enable two-factor?', 'Security → Set up two-factor. Scan the QR code with an authenticator app and confirm a 6-digit code.'],
    ['What happens when I change my password?', 'All other sessions are revoked and you are notified.'],
    ['Can I see active sessions?', 'Yes — Security lists every session with device, IP and last-seen time, and lets you revoke any of them.'],
  ]},
];

export default function HelpPage() {
  return (
    <>
      <PageHero eyebrow="Help center" title="Answers, straight from the platform" body="Everything below describes how this platform actually behaves — including where a provider is not connected." />
      <div className="mx-auto max-w-4xl px-5 py-12">
        {TOPICS.map((t) => (
          <section key={t.title} className="mb-8">
            <h2 className="text-[15px] font-semibold text-white">{t.title}</h2>
            <div className="mt-3 divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.07]">
              {t.items.map(([q, a]) => (
                <details key={q} className="group bg-ink-850/60 px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13px] font-medium text-white">
                    {q}<span className="text-muted transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        <div className="panel p-5">
          <h2 className="text-[14px] font-semibold text-white">Still need help?</h2>
          <p className="mt-1.5 text-[12.5px] text-muted">Sign in and open a support ticket — it is tracked with a category, priority and conversation history.</p>
          <div className="mt-3 flex gap-2">
            <Link href="/dashboard/support" className="btn-primary px-4 py-2 text-[12.5px]">Open a ticket</Link>
            <Link href="/contact" className="btn-ghost px-4 py-2 text-[12.5px]">Contact details</Link>
          </div>
        </div>
      </div>
      <CTASection title="New to Vanta?" body="Create an account to access the help center from your dashboard." primary={{ href: '/register', label: 'Open account' }} secondary={{ href: '/login', label: 'Sign in' }} />
    </>
  );
}
