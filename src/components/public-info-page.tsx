import Link from 'next/link';
import { PageHero, Section, FeatureGrid, CTASection, Callout } from '@/components/marketing-ui';
import { LiveMarketTable } from '@/components/live-market-table';
import { MarketSessions } from '@/components/markets/market-sessions';

type InfoPage = {
  eyebrow: string;
  title: string;
  body: string;
  features: { title: string; body: string }[];
  market?: 'FOREX' | 'SPOT' | 'CFD' | 'FUTURES' | 'BINARY';
  notice?: { title: string; body: string };
};

const HERO_IMAGES: Record<string, string> = {
  FOREX: '/images/hero-dealing.jpg',
  SPOT: '/images/hero-markets.webp',
  CFD: '/images/hero-workspace.webp',
  FUTURES: '/images/hero-markets.webp',
  BINARY: '/images/hero-perspective.webp',
};

export function PublicInfoPage({ eyebrow, title, body, features, market, notice }: InfoPage) {
  return <>
    <PageHero eyebrow={eyebrow} title={title} body={body} breadcrumbs={[{ label: title }]} image={market ? HERO_IMAGES[market] : '/images/hero-workspace.webp'}>
      <div className="flex flex-wrap gap-3"><Link href="/markets" className="btn-primary px-5 py-2.5">Explore markets</Link><Link href="/register" className="btn-ghost px-5 py-2.5">Create account</Link></div>
    </PageHero>
    <Section eyebrow="PRIMEVEST" title="A clearer view" body="Explore the details and make informed decisions."><FeatureGrid items={features} /></Section>
    {market && <Section eyebrow="Market watch" title="Live prices" body="Streaming market information, refreshed continuously while markets are open."><LiveMarketTable category={market} limit={12} /></Section>}
    <Section eyebrow="Trading hours" title="Market sessions right now" body="Live status of the global trading clock — crypto runs around the clock, currency centres follow local windows."><MarketSessions /></Section>
    {notice && <Section tight><Callout title={notice.title}>{notice.body}</Callout></Section>}
    <CTASection title="Explore the markets with PRIMEVEST" body="Follow market information and manage your account in one place." primary={{ href: '/markets', label: 'Explore markets' }} secondary={{ href: '/register', label: 'Create account' }} />
  </>;
}
