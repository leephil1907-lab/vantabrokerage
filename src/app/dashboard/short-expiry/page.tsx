import Link from 'next/link';

export default function ShortExpiryPage() {
  return <div className="space-y-5">
    <div><h1 className="text-xl font-semibold text-white">Short-expiry products</h1><p className="mt-2 text-sm text-muted">Explore market information in your PRIMEVEST workspace.</p></div>
    <div className="panel p-5"><p className="text-sm font-semibold text-white">Short-expiry trading</p><p className="mt-2 text-sm leading-relaxed text-muted">CALL and PUT trading is rolling out to the terminal. Meanwhile, explore the forex and crypto desks.</p><Link href="/dashboard/forex" className="btn-ghost mt-4 inline-flex px-4 py-2">Explore forex</Link></div>
  </div>;
}
