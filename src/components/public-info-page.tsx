import Link from 'next/link';
import { PageHero, Section, FeatureGrid, CTASection, Callout } from '@/components/marketing-ui';
import { LiveMarketTable } from '@/components/live-market-table';

type InfoPage = {
  eyebrow: string;
  title: string;
  body: string;
  features: { title: string; body: string }[];
  market?: 'FOREX' | 'SPOT';
  notice?: { title: string; body: string };
};

export function PublicInfoPage({ eyebrow, title, body, features, market, notice }: InfoPage) {
  return <>
    <PageHero eyebrow={eyebrow} title={title} body={body} breadcrumbs={[{ label: title }]}>
      <div className="flex flex-wrap gap-3"><Link href="/markets" className="btn-primary px-5 py-2.5">Explore markets</Link><Link href="/register" className="btn-ghost px-5 py-2.5">Create account</Link></div>
    </PageHero>
    <Section eyebrow="PRIMEVEST" title="A clearer view" body="Explore the details and make informed decisions."><FeatureGrid items={features} /></Section>
    {market && <Section eyebrow="Market watch" title="Reference prices" body="Indicative market information is subject to availability and may be delayed. It is not an executable quote."><LiveMarketTable category={market} limit={12} /></Section>}
    {notice && <Section tight><Callout title={notice.title}>{notice.body}</Callout></Section>}
    <CTASection title="Explore the markets with PRIMEVEST" body="Follow market information and manage your account in one place." primary={{ href: '/markets', label: 'Explore markets' }} secondary={{ href: '/register', label: 'Create account' }} />
  </>;
}
