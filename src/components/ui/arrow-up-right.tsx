/** Drawn arrow glyph — one consistent stroke, sized to the surrounding type. */
export function ArrowUpRight({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={`inline-block h-[0.8em] w-[0.8em] translate-y-[-0.5px] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.6 9.4 9.4 2.6M4.2 2.6h5.2v5.2" />
    </svg>
  );
}
