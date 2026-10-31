import { PageHero, Section } from '@/components/marketing-ui';

export const metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to the desk" body="Support runs through your dashboard ticket system so every conversation is attached to your account and auditable. For pre-registration questions, use the details below." />
      <Section title="How to reach us">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Client support', 'Sign in → Support → New ticket', 'Tracked with category, priority and full conversation history.'],
            ['Compliance & verification', 'Sign in → Verification', 'Submit documents and receive the review outcome with reasons on rejection.'],
            ['General enquiries', 'support@vantamarkets.com', 'Replace with your operating desk address before going live.'],
          ].map(([t, v, b]) => (
            <div key={t} className="panel p-5">
              <h3 className="text-[13px] font-semibold text-white">{t}</h3>
              <p className="mt-1.5 text-[12.5px] font-medium text-lime">{v}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{b}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Before you contact us" tight>
        <div className="panel p-5 text-[12.5px] leading-relaxed text-muted">
          <ul className="space-y-2">
            <li>• For withdrawal questions, include the request reference from your Withdrawals page.</li>
            <li>• For deposit issues, include the asset, network and transaction hash.</li>
            <li>• For trading issues, include the market, order id and timestamp shown in your order history.</li>
            <li>• Urgent account-security concerns are prioritised — mention it in the ticket priority.</li>
          </ul>
        </div>
      </Section>
    </>
  );
}
