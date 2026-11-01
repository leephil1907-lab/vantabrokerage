import { getSessionUser } from '@/lib/auth';
import { SiteNav } from '@/components/site-nav';
import { SiteFooter } from '@/components/site-footer';
import { NotFoundScene } from '@/components/motion/not-found-scene';

export const metadata = { title: 'Page not found (404)' };

/**
 * Cinematic 404 with the full site shell: unmatched URLs always bubble to the
 * root not-found, so the navigation and footer are rendered here to keep the
 * visitor oriented — every exit stays one meaningful click away.
 */
export default async function NotFound() {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav authenticated={!!user} />
      <main className="flex-1"><NotFoundScene /></main>
      <SiteFooter />
    </div>
  );
}
