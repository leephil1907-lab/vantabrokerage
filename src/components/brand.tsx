import Link from 'next/link';

/** VANTA Markets identity: a chevron mark built from ascending market bars. */
export function Logo({ size = 28, withWordmark = true, href = '/' }: { size?: number; withWordmark?: boolean; href?: string | null }) {
  const mark = (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#vg)" />
        <rect x="1" y="1" width="30" height="30" rx="9" stroke="rgba(255,255,255,0.12)" />
        <path d="M9 21.5 15 10l3.3 6.2 2.2-3.6L24 21.5" stroke="#08090b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="22.6" cy="12.4" r="1.7" fill="#08090b" />
        <defs>
          <linearGradient id="vg" x1="4" y1="30" x2="28" y2="2" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9bd024" />
            <stop offset="0.55" stopColor="#c8f751" />
            <stop offset="1" stopColor="#d6ff6b" />
          </linearGradient>
        </defs>
      </svg>
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-white">VANTA</span>
          <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.32em] text-muted">Markets</span>
        </span>
      )}
    </span>
  );
  if (!href) return mark;
  return (
    <Link href={href} className="transition-opacity hover:opacity-90" aria-label="Vanta Markets home">
      {mark}
    </Link>
  );
}
