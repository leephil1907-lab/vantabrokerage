'use client';

import { ASSET_COLORS, CRYPTO_PNG, CRYPTO_SVG } from './asset-marks';

/** ISO country codes for locally hosted FlagCDN country flags. */
const CURRENCY_COUNTRY: Record<string, string> = {
  USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp', CHF: 'ch', AUD: 'au', CAD: 'ca', NZD: 'nz',
  CNY: 'cn', TRY: 'tr', ZAR: 'za', SEK: 'se', NOK: 'no', MXN: 'mx', SGD: 'sg', HKD: 'hk',
};

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CHF: '₣', AUD: 'A$', CAD: 'C$', NZD: 'NZ$',
};

function baseOf(symbol: string) {
  return symbol.split('/')[0].replace('-PERP', '').replace('-BIN', '').trim();
}

/** Currency flag from locally hosted real flag assets, with a typographic fallback. */
export function CurrencyFlag({ code, size = 20 }: { code: string; size?: number }) {
  const country = CURRENCY_COUNTRY[code];
  if (!country) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] font-semibold text-white"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
        aria-label={code}
      >
        {code.slice(0, 1)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${country}.png`}
      alt={`${code} flag`}
      width={size}
      height={size}
      decoding="async"
      className="rounded-full object-cover ring-1 ring-white/15"
      style={{ width: size, height: size }}
    />
  );
}

/** ISO-3166 country flag from locally hosted assets, typographic fallback. */
export function CountryFlag({ code, size = 20 }: { code: string; size?: number }) {
  const c = code.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${c}.png`}
      alt={`${code} flag`}
      width={size}
      height={size}
      decoding="async"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
      className="rounded-full object-cover ring-1 ring-white/15"
      style={{ width: size, height: size }}
    />
  );
}

/** Official crypto brand mark — SVG from Simple Icons or CoinGecko metadata image. */
export function CryptoMark({ asset, size = 20 }: { asset: string; size?: number }) {
  const key = asset.toLowerCase();
  const svg = CRYPTO_SVG[key];
  const png = CRYPTO_PNG[key];
  if (png) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={png} alt={`${asset} logo`} width={size} height={size} loading="lazy" decoding="async" className="rounded-full" style={{ width: size, height: size }} />;
  }
  if (svg) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: svg.replace('<svg ', '<svg width="100%" height="100%" ') }}
        aria-label={`${asset} logo`}
        role="img"
      />
    );
  }
  return <Monogram label={asset} color={ASSET_COLORS[asset.toUpperCase()] ?? '#8a97a6'} size={size} />;
}

function Monogram({ label, color, size }: { label: string; color: string; size: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{ width: size, height: size, background: `${color}22`, color, border: `1px solid ${color}55`, fontSize: size * 0.4 }}
    >
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}

const INDEX_GLYPH: Record<string, string> = {
  NAS100: 'M2 12h3l2-6 3 10 2.5-7 1.5 3H18',
  SPX500: 'M2 13l3-4 3 3 3-6 3 5 2-2h2',
  US30: 'M2 14l3-2 3-4 3 5 3-6 2 4h2',
  GER40: 'M2 12l3-3 3 4 3-7 3 6 2-2h2',
  UK100: 'M2 11l3-2 3-3 3 5 3-4 2 3h2',
  XAU: 'M10 3l-5 9h6l-1 5 5-9H9z',
  XAG: 'M10 3l-5 9h6l-1 5 5-9H9z',
  WTI: 'M10 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z',
  NG: 'M10 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z',
};

/** Instrument icon for indices and commodities — consistent geometry, instrument-specific. */
const METAL_MARK: Record<string, { fill: string; edge: string }> = {
  XAU: { fill: '#F0B429', edge: '#8a6a1f' },
  XAG: { fill: '#C7CED9', edge: '#6b7686' },
};
const ENERGY_MARK: Record<string, { color: string; d: string }> = {
  NATGAS: { color: '#38bdf8', d: 'M10 2.6c2.5 2.9 4.6 5.2 4.6 8a4.6 4.6 0 0 1-9.2 0c0-1.5.6-2.8 1.5-4.1.3 1 .9 1.8 1.7 2.3-.2-2.2.3-4.3 1.4-6.2Z' },
  WTIUSD: { color: '#c08428', d: 'M10 2.8c3 3.6 5 6.3 5 9a5 5 0 0 1-10 0c0-2.7 2-5.4 5-9Z' },
};
const INDEX_CODE: Record<string, { code: string; color: string }> = {
  US30: { code: 'DOW', color: '#3b82f6' },
  NAS100: { code: 'NDX', color: '#8b5cf6' },
  SPX500: { code: 'SPX', color: '#22c55e' },
  GER40: { code: 'DAX', color: '#f59e0b' },
  UK100: { code: 'FTSE', color: '#ec4899' },
};

/** Precise, non-colliding badge for metals, energy and index instruments. */
export function InstrumentMark({ asset, size = 20, className = '' }: { asset: string; size?: number; className?: string }) {
  const raw = asset.toUpperCase();
  const key = raw.startsWith('XAU') ? 'XAU' : raw.startsWith('XAG') ? 'XAG' : raw === 'NG' ? 'NATGAS' : raw === 'WTI' ? 'WTIUSD' : raw;
  const metal = METAL_MARK[key];
  const energy = ENERGY_MARK[key];
  const index = INDEX_CODE[key];
  if (metal) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }} aria-label={key}>
        <svg viewBox="0 0 20 20" width={size} height={size}>
          <path d="M4.2 8.4h7.2l1.6 3.2H2.6Z" fill={metal.fill} stroke={metal.edge} strokeWidth=".7" />
          <path d="M6.6 4.6h7.2l1.6 3.2H5Z" fill={metal.fill} opacity=".82" stroke={metal.edge} strokeWidth=".7" />
          <path d="M5.4 12.2h7.2l1.6 3.2H3.8Z" fill={metal.fill} opacity=".62" stroke={metal.edge} strokeWidth=".7" />
        </svg>
      </span>
    );
  }
  if (energy) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`} style={{ width: size, height: size, background: `${energy.color}1c`, border: `1px solid ${energy.color}55` }} aria-label={key}>
        <svg viewBox="0 0 20 20" width={size * 0.72} height={size * 0.72}>
          <path d={energy.d} fill={energy.color} />
        </svg>
      </span>
    );
  }
  if (index) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-mono font-bold ${className}`} style={{ width: size, height: size, background: `${index.color}1a`, border: `1.4px solid ${index.color}80`, color: index.color, fontSize: Math.max(6, size * 0.3) }} aria-label={key}>
        {index.code}
      </span>
    );
  }
  const color = ASSET_COLORS[raw] ?? ASSET_COLORS[key] ?? '#8a97a6';
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-lg font-mono font-bold ${className}`} style={{ width: size, height: size, background: `${color}1f`, border: `1px solid ${color}4d`, color, fontSize: size * 0.38 }} aria-label={key}>
      {raw.slice(0, 2)}
    </span>
  );
}

/**
 * Universal instrument badge used in watchlists, selectors, order panels, charts,
 * positions, holdings, transactions and market tables — one consistent treatment.
 */
export function AssetMark({ symbol, size = 20, className = '' }: { symbol: string; size?: number; className?: string }) {
  const base = baseOf(symbol);
  const upper = base.toUpperCase();
  const isCrypto = ['BTC', 'ETH', 'SOL', 'XRP', 'LTC', 'DOGE', 'BNB', 'ADA', 'TRX', 'USDC', 'USDT'].includes(upper);
  const isFx = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'].includes(upper) && symbol.includes('/');

  if (isCrypto) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <CryptoMark asset={upper} size={size} />
      </span>
    );
  }
  if (isFx) {
    // Forex pairs get a stacked currency flag pair.
    const [b, q] = symbol.split('/');
    return (
      <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
        <span className="absolute left-0 top-0"><CurrencyFlag code={b} size={size * 0.72} /></span>
        <span className="absolute bottom-0 right-0 rounded-full ring-1 ring-ink-900"><CurrencyFlag code={q} size={size * 0.62} /></span>
      </span>
    );
  }
  return <InstrumentMark asset={upper} size={size} className={className} />;
}

/** Symbol + name + icon, used in lists and tables. */
export function AssetLabel({ symbol, name, size = 20, sub }: { symbol: string; name?: string; size?: number; sub?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <AssetMark symbol={symbol} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-medium text-white">{symbol}</span>
        {(name || sub) && <span className="block truncate text-[10px] text-muted">{sub ?? name}</span>}
      </span>
    </span>
  );
}
