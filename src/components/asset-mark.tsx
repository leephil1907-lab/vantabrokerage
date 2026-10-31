'use client';

import { ASSET_COLORS, CRYPTO_PNG, CRYPTO_SVG } from './asset-marks';

/** ISO country codes for currency flags (flagcdn / emoji fallback). */
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

/** Currency flag from a consistent CDN asset library, with a typographic fallback. */
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
      src={`https://flagcdn.com/w40/${country}.png`}
      srcSet={`https://flagcdn.com/w80/${country}.png 2x`}
      alt={`${code} flag`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
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
export function InstrumentMark({ asset, size = 20, className = '' }: { asset: string; size?: number; className?: string }) {
  const key = asset.toUpperCase();
  const color = ASSET_COLORS[key] ?? '#8a97a6';
  const path = INDEX_GLYPH[key];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg"
      style={{ width: size, height: size, background: `${color}1f`, border: `1px solid ${color}4d` }}
    >
      {path ? (
        <svg viewBox="0 0 20 20" width={size * 0.68} height={size * 0.68} fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d={path} />
        </svg>
      ) : (
        <span style={{ color, fontSize: size * 0.4, fontWeight: 700 }}>{key.slice(0, 2)}</span>
      )}
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
