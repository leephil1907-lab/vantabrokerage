'use client';

import { useEffect } from 'react';
import { BrandLoader } from '@/components/brand';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="panel mx-auto max-w-lg p-6 text-center">
      <BrandLoader label="This panel failed to load" sub="The rest of the workspace is unaffected." />
      <p className="mt-2 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-left text-[11.5px] leading-relaxed text-danger">
        {error.message || 'Unexpected client error'}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={reset} className="btn-primary px-4 py-2 text-[12.5px]">Retry panel</button>
        <a href="/dashboard" className="btn-ghost px-4 py-2 text-[12.5px]">Back to overview</a>
      </div>
    </div>
  );
}
