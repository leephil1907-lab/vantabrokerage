import Link from 'next/link';

/**
 * VANTA Markets identity — an original mark (do not copy VideForex branding).
 * The glyph is a "V" cut from ascending market bars; it reads as a chart and
 * as a letterform at 16px, and scales to 512px for avatars/favicons.
 */
export function VantaGlyph({ size = 32, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id="vanta-a" x1="4" y1="36" x2="36" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9bd024" />
          <stop offset="0.55" stopColor="#c8f751" />
          <stop offset="1" stopColor="#d6ff6b" />
        </linearGradient>
        <linearGradient id="vanta-b" x1="10" y1="30" x2="30" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2ee6a8" />
          <stop offset="1" stopColor="#c8f751" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="12" fill="url(#vanta-a)" />
      <rect x="1" y="1" width="38" height="38" rx="12" stroke="rgba(255,255,255,0.18)" />
      <path d="M11 26.5 19.2 11l4.1 7.7 2.7-4.4L29 26.5" stroke="#08090b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="27.9" cy="15.1" r="2" fill="#08090b" />
      {glow && <rect x="1" y="1" width="38" height="38" rx="12" fill="none" stroke="url(#vanta-b)" strokeWidth="1.4" opacity="0.9" />}
    </svg>
  );
}

export function Logo({ size = 32, withWordmark = true, href = '/' }: { size?: number; withWordmark?: boolean; href?: string | null }) {
  const mark = (
    <span className="inline-flex items-center gap-2.5">
      <VantaGlyph size={size} />
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-[15.5px] font-semibold tracking-[-0.01em] text-white">VANTA</span>
          <span className="mt-[3px] text-[9px] font-medium uppercase tracking-[0.34em] text-muted">Markets</span>
        </span>
      )}
    </span>
  );
  if (!href) return mark;
  return (
    <Link href={href} className="transition-opacity duration-200 hover:opacity-90" aria-label="Vanta Markets home">
      {mark}
    </Link>
  );
}

/** Animated brand loader — used for route loading states, never a bare spinner. */
export function BrandLoader({ label = 'Loading workspace', sub }: { label?: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <span className="relative inline-flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-lime/10 blur-md brand-pulse" />
        <span className="relative float-y">
          <VantaGlyph size={40} glow />
        </span>
      </span>
      <div className="text-center">
        <p className="text-[12.5px] font-medium text-white">{label}</p>
        {sub && <p className="mt-1 text-[11px] text-muted">{sub}</p>}
      </div>
      <div className="relative h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
        <span className="sweep absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-lime to-transparent" />
      </div>
    </div>
  );
}
