import Link from 'next/link';
import { NotFoundScene } from '@/components/motion/not-found-scene';

export const metadata = { title: 'Page not found (404)' };

/** Marketing 404 — rendered inside the site shell (nav + footer intact). */
export default function NotFound() {
  return <NotFoundScene />;
}
