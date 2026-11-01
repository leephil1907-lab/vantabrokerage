import Link from 'next/link';

/** PRIMEVEST identity, vectorized from the selected logo concept. */
export function PrimevestGlyph({ size = 32, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="-18 -18 244 300" fill="none" aria-hidden="true" focusable="false">
      <defs><linearGradient id="primevest-mark-gradient" x1="0" y1="0" x2="208" y2="240" gradientUnits="userSpaceOnUse"><stop stopColor="#27ec65"/><stop offset="1" stopColor="#dfc088"/></linearGradient></defs>
      <g fill="url(#primevest-mark-gradient)" opacity={glow ? 1 : 0.98}>
        <path d="M155,40 L151,40 L150,41 L135,41 L134,42 L114,42 L113,43 L87,44 L86,45 L80,45 L76,47 L66,49 L53,55 L38,65 L34,70 L32,70 L32,71 L30,72 L14,92 L14,94 L12,95 L5,111 L4,117 L2,121 L1,132 L0,133 L0,261 L1,262 L7,262 L8,263 L36,263 L34,262 L36,260 L36,155 L37,154 L37,142 L38,141 L39,131 L44,120 L43,119 L45,118 L46,115 L55,103 L63,96 L76,89 L78,89 L81,87 L84,87 L89,85 L95,85 L96,84 L134,84 L135,85 L140,85 L146,87 L156,93 L163,101 L167,104 L166,105 L170,111 L170,114 L172,119 L172,128 L171,129 L171,134 L166,145 L158,154 L153,158 L143,163 L137,165 L133,165 L132,166 L108,167 L107,166 L96,165 L94,163 L89,161 L82,154 L76,144 L74,144 L72,142 L67,145 L61,151 L59,155 L59,159 L63,170 L63,173 L68,183 L67,184 L59,177 L55,177 L53,183 L53,195 L52,196 L52,236 L53,237 L61,237 L63,235 L62,234 L62,226 L65,217 L74,207 L78,205 L79,203 L81,203 L84,201 L88,201 L92,203 L97,203 L103,205 L130,205 L131,204 L137,204 L138,203 L147,202 L156,199 L170,192 L181,184 L189,175 L191,174 L197,165 L203,153 L203,150 L206,142 L206,138 L207,137 L207,117 L206,116 L205,106 L201,94 L191,77 L176,61 L157,49 L157,44 L156,43 L157,42 L155,42 L154,41Z" />
        <path d="M72,10 L72,20 L73,21 L167,21 L168,19 L169,20 L169,11 L168,11 L167,9 L73,9Z" />
        <path d="M190,0 L189,1 L189,5 L190,6 L189,7 L181,7 L180,9 L180,41 L182,42 L183,41 L185,42 L201,42 L202,41 L201,39 L202,38 L202,8 L201,7 L195,7 L194,6 L194,1Z" />
      </g>
    </svg>
  );
}

export function Logo({ size = 32, withWordmark = true, href = '/' }: { size?: number; withWordmark?: boolean; href?: string | null }) {
  const mark = (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label="PRIMEVEST">
      <PrimevestGlyph size={size} />
      {withWordmark && <span aria-hidden="true" className="text-[15px] font-semibold tracking-[0.055em] text-white">RIMEVEST</span>}
    </span>
  );
  if (!href) return mark;
  return <Link href={href} className="transition-opacity duration-200 hover:opacity-90" aria-label="PRIMEVEST home">{mark}</Link>;
}

export function BrandLoader({ label = 'Loading workspace', sub }: { label?: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <span className="relative inline-flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-lime/10 blur-md brand-pulse" />
        <span className="relative float-y"><PrimevestGlyph size={40} glow /></span>
      </span>
      <div className="text-center"><p className="text-[12.5px] font-medium text-white">{label}</p>{sub && <p className="mt-1 text-[11px] text-muted">{sub}</p>}</div>
      <div className="relative h-[2px] w-40 overflow-hidden rounded-full bg-white/10"><span className="sweep absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-lime to-transparent" /></div>
    </div>
  );
}
