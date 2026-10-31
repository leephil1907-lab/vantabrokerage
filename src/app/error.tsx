'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger">!</div>
      <div>
        <h1 className="text-lg font-semibold text-white">Something went wrong</h1>
        <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-muted">{error.message || 'An unexpected error occurred while rendering this view.'}</p>
        {error.digest && <p className="mt-1 text-[10.5px] text-muted">Reference: {error.digest}</p>}
      </div>
      <button onClick={reset} className="btn-primary px-4 py-2 text-[13px]">Try again</button>
    </div>
  );
}
