import Link from 'next/link';
import { PageHero, Section, StatBand, CTASection, Callout } from '@/components/marketing-ui';
import { Accordion } from '@/components/accordion';

export const metadata = { title: 'Help centre' };

const TOPICS = [
  {
    title: 'Getting started',
    items: [
      { q: 'How do I create an account?', a: 'Use the registration form with your email and country. You receive a live account and a funded paper account immediately, plus a verification email.' },
      { q: 'What is the paper account?', a: 'A simulated account funded on registration. It uses the same terminals, order path and risk engine, but with simulated balances labelled PAPER everywhere.' },
      { q: 'Do I need to deposit to start?', a: 'No. You can explore the terminals with simulated funds. Live execution and funding are not ready for real money.' },
      { q: 'How do I enable two-factor authentication?', a: 'Sign in → Security → Enable 2FA. Scan the QR code with an authenticator app and confirm a code. 2FA is then required at sign-in and for withdrawals.' },
    ],
  },
  {
    title: 'Trading',
    items: [
      { q: 'Where do prices come from?', a: 'Server-side from Kraken, Coinbase and Yahoo Finance for configured instruments. Each quote stores its provider and fetch timestamp; stale quotes are labelled.' },
      { q: 'How are orders priced?', a: 'Market orders fill at the quoted side (ask for buys, bid for sells). Limit and stop orders rest with margin reserved until the worker triggers them.' },
      { q: 'What does liquidation mean?', a: 'When equity falls below the maintenance requirement the risk engine closes the position at an engine-computed price and records the loss.' },
      { q: 'Can I close part of a position?', a: 'Yes — positions support partial and full closes, with realised P/L posted to the ledger at close.' },
    ],
  },
  {
    title: 'Funding',
    items: [
      { q: 'How do I deposit?', a: 'Do not deposit real funds. Automated on-chain verification, card and bank payment integrations are not connected in this demonstration.' },
      { q: 'Why is my withdrawal pending?', a: 'Withdrawals move through re-authentication → locked → finance review → paid. Your dashboard shows the current state and the last actor.' },
      { q: 'What do I need before withdrawing?', a: 'Approved KYC, re-authentication (password plus 2FA if enabled) and available balance.' },
    ],
  },
  {
    title: 'Security & account',
    items: [
      { q: 'How do I see active sessions?', a: 'Security → Sessions lists each session with device and IP, and lets you revoke any of them individually.' },
      { q: 'What happens if I reset my password?', a: 'All existing sessions are revoked and you must sign in again. This is deliberate: a password reset invalidates anything that may have been compromised.' },
      { q: 'How do I update my profile?', a: 'Settings → Profile. Email changes require re-verification; country and name changes may require compliance review.' },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Help centre"
        title="Answers for the questions that actually come up"
        body="Short, specific explanations of how the platform behaves — including what it does when a provider is unavailable. If something is not covered, open a support ticket from your dashboard."
        breadcrumbs={[{ label: 'Help' }]}
        aside={<StatBand items={[
          { k: '4', label: 'Topic areas', sub: 'start · trade · fund · secure' },
          { k: '15', label: 'Answers', sub: 'updated with the build' },
          { k: 'ticket', label: 'Escalation', sub: 'in-dashboard' },
          { k: '24/7', label: 'Account access', sub: 'always available' },
        ]} />}
      >
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => <a key={t.title} href={`#${t.title.replace(/\W+/g, '-').toLowerCase()}`} className="chip hover:border-white/25 hover:text-white">{t.title}</a>)}
        </div>
      </PageHero>

      <Section eyebrow="Topics" title="Browse by area">
        <div className="grid gap-6 lg:grid-cols-2">
          {TOPICS.map((topic) => (
            <div key={topic.title} id={topic.title.replace(/\W+/g, '-').toLowerCase()} className="scroll-mt-24">
              <h3 className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-white">{topic.title}</h3>
              <Accordion items={topic.items} defaultOpen={null} dense />
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Still stuck?" title="Escalate to the desk" tight>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Callout tone="info" title="Existing client">
            Sign in and open a ticket from <Link href="/dashboard/support" className="underline">Support</Link>. Tickets carry your account, category and full history.
          </Callout>
          <Callout tone="ok" title="Not registered yet">
            Create an account to reach support — or read the <Link href="/trading-conditions" className="underline">trading conditions</Link> for fees and leverage caps.
          </Callout>
        </div>
      </Section>

      <CTASection title="Try it with simulated funds" body="Every new account gets a funded paper account, so you can test every workflow described here." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/login', label: 'Sign in' }} />
    </>
  );
}
