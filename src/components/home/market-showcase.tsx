'use client';
import Link from 'next/link';
import { useState } from 'react';
import { TradingViewPanel } from '@/components/terminal/tradingview-panel';
import { VenueDepth } from '@/components/terminal/venue-depth';
const PAIRS = [
  { label:'Bitcoin', symbol:'BTC/USD', tv:'KRAKEN:BTCUSD' },
  { label:'Ethereum', symbol:'ETH/USD', tv:'KRAKEN:ETHUSD' },
  { label:'Solana', symbol:'SOL/USD', tv:'KRAKEN:SOLUSD' },
  { label:'Euro / US dollar', symbol:'EUR/USD', tv:'FX:EURUSD' },
];
export function MarketShowcase({ authenticated = false }: { authenticated?: boolean }) {
  const [active, setActive] = useState(0); const pair = PAIRS[active];
  return <section id="live-charts" className="showcase-section">
    <div className="mx-auto max-w-7xl px-5">
      <div className="showcase-heading"><div><p className="section-kicker"><span/> THE MARKET WORKSPACE</p><h2>See the market<br/><em>in motion.</em></h2><p>Explore interactive charts and current market depth, with the context to see the bigger picture.</p></div><Link href={authenticated ? "/dashboard/trade" : "/login?next=%2Fdashboard%2Ftrade"} className="showcase-link">Open trading workspace <span aria-hidden="true">↗</span></Link></div>
      <div className="showcase-workspace">
        <div className="showcase-toolbar"><div><span className="showcase-live-dot"/> <strong>Market view</strong><span className="showcase-toolbar-sub">TradingView charts · Kraken depth</span></div><span className="showcase-ref">EXTERNAL REFERENCE DATA</span></div>
        <div className="showcase-pairs" aria-label="Choose a market">{PAIRS.map((p,i)=><button type="button" key={p.symbol} onClick={()=>setActive(i)} aria-pressed={i===active} className={i===active?'active':''}><span>{p.symbol}</span><small>{p.label}</small></button>)}</div>
        <div className="showcase-grid"><div className="showcase-chart"><div className="showcase-chart-label"><span>{pair.symbol}</span><small>TradingView · {pair.tv.split(':')[0]}</small></div><TradingViewPanel symbol={pair.tv} height={450}/></div><VenueDepth symbol={pair.symbol}/></div>
        <p className="showcase-note">Third-party market data is indicative and may be delayed. Market depth is from Kraken, not PRIMEVEST customer orders. Charts do not place orders.</p>
      </div>
    </div>
  </section>;
}
