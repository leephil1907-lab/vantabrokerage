import { getSessionUser } from '@/lib/auth';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { PageTransition } from '@/components/motion/page-transition';
import { MobileTabBar } from '@/components/mobile-tab-bar';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-screen flex-col pb-[62px] md:pb-0">
      <SiteNav authenticated={!!user} />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
      <MobileTabBar authenticated={!!user} />
    </div>
  );
}
