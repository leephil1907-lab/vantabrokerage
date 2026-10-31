import { BrandLoader } from './brand';
import { SkeletonRows } from './motion/skeletons';

/**
 * Route-level loading UI. Rendered by Next's `loading.tsx` conventions, so a
 * skeleton appears the instant a segment starts streaming — never a blank page
 * and never a bare spinner.
 */
export function DashboardLoading({ label = 'Loading workspace' }: { label?: string }) {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="skeleton h-5 w-44" />
          <div className="skeleton h-3 w-64" />
        </div>
        <div className="skeleton h-9 w-40" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel p-4">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton mt-3 h-6 w-28" />
            <div className="skeleton mt-2 h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="panel p-4">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton mt-4 h-[260px] w-full" />
        </div>
        <div className="panel p-4">
          <div className="skeleton h-4 w-24" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-9 w-full" />)}
          </div>
        </div>
      </div>
      <SkeletonRows rows={4} />
      <div className="sr-only">{label}</div>
    </div>
  );
}

export function MarketingLoading({ label = 'Loading' }: { label?: string }) {
  return <div className="shell py-16"><BrandLoader label={label} sub="Fetching market data" /></div>;
}
