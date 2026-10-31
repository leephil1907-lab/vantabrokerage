import { getSessionUser } from '@/lib/auth';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav authenticated={!!user} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
