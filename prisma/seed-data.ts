import type { PrismaClient } from '@prisma/client';

/**
 * Reference market definitions, shared by the development seed and the
 * staff-guarded admin "populate reference markets" action so an empty
 * production database can be filled with instrument definitions (and only
 * instrument definitions — never accounts or credentials) from the back office.
 */
type PairSeed = {
  symbol: string;
  displayName: string;
  baseAsset: string;
  quoteAsset: string;
  assetClass: 'FOREX' | 'INDEX' | 'COMMODITY' | 'CRYPTO';
  category: 'FOREX' | 'CFD' | 'BINARY' | 'SPOT' | 'FUTURES';
  pricePrecision: number;
  qtyPrecision: number;
  minQty: string;
  maxLeverage: number;
  takerFee: string;
  makerFee: string;
  payoutRate?: string;
  dataSource: string;
  sourceSymbol?: string;
  display: string;
};

const FOREX: PairSeed[] = [
  ['EUR/USD', 'Euro / US Dollar', 'EUR', 'USD', '5', '0.01', '0.0009', 'EURUSD=X'],
  ['GBP/USD', 'British Pound / US Dollar', 'GBP', 'USD', '5', '0.01', '0.0009', 'GBPUSD=X'],
  ['USD/JPY', 'US Dollar / Japanese Yen', 'USD', 'JPY', '3', '0.01', '0.0009', 'USDJPY=X'],
  ['USD/CHF', 'US Dollar / Swiss Franc', 'USD', 'CHF', '5', '0.01', '0.0009', 'USDCHF=X'],
  ['AUD/USD', 'Australian Dollar / US Dollar', 'AUD', 'USD', '5', '0.01', '0.0009', 'AUDUSD=X'],
  ['USD/CAD', 'US Dollar / Canadian Dollar', 'USD', 'CAD', '5', '0.01', '0.0009', 'USDCAD=X'],
  ['NZD/USD', 'New Zealand Dollar / US Dollar', 'NZD', 'USD', '5', '0.01', '0.0009', 'NZDUSD=X'],
].map(([symbol, displayName, baseAsset, quoteAsset, pricePrecision, minQty, takerFee, sourceSymbol]) => ({
  symbol: symbol as string,
  displayName: displayName as string,
  baseAsset: baseAsset as string,
  quoteAsset: quoteAsset as string,
  assetClass: 'FOREX' as const,
  category: 'FOREX' as const,
  pricePrecision: Number(pricePrecision) > 3 ? 5 : 3,
  qtyPrecision: 2,
  minQty: '0.01',
  maxLeverage: 200,
  takerFee: takerFee as string,
  makerFee: '0.0002',
  payoutRate: '0.82',
  dataSource: 'yahoo',
  sourceSymbol: sourceSymbol as string,
  display: displayName as string,
}));

function withDefaults(p: PairSeed): PairSeed {
  return { ...p, display: p.display ?? p.displayName };
}

const INDICES: PairSeed[] = [
  { symbol: 'NAS100', displayName: 'NASDAQ 100', baseAsset: 'NAS100', quoteAsset: 'USD', assetClass: 'INDEX', category: 'CFD', pricePrecision: 2, qtyPrecision: 2, minQty: '0.1', maxLeverage: 100, takerFee: '0.0015', makerFee: '0.0003', payoutRate: '0.80', dataSource: 'yahoo', sourceSymbol: '^NDX', display: 'NASDAQ 100' },
  { symbol: 'SPX500', displayName: 'S&P 500', baseAsset: 'SPX500', quoteAsset: 'USD', assetClass: 'INDEX', category: 'CFD', pricePrecision: 2, qtyPrecision: 2, minQty: '0.1', maxLeverage: 100, takerFee: '0.0015', makerFee: '0.0003', payoutRate: '0.80', dataSource: 'yahoo', sourceSymbol: '^GSPC', display: 'S&P 500' },
  { symbol: 'US30', displayName: 'Dow Jones 30', baseAsset: 'US30', quoteAsset: 'USD', assetClass: 'INDEX', category: 'CFD', pricePrecision: 2, qtyPrecision: 2, minQty: '0.1', maxLeverage: 100, takerFee: '0.0015', makerFee: '0.0003', payoutRate: '0.80', dataSource: 'yahoo', sourceSymbol: '^DJI', display: 'Dow Jones 30' },
  { symbol: 'GER40', displayName: 'DAX 40', baseAsset: 'GER40', quoteAsset: 'EUR', assetClass: 'INDEX', category: 'CFD', pricePrecision: 2, qtyPrecision: 2, minQty: '0.1', maxLeverage: 100, takerFee: '0.0015', makerFee: '0.0003', payoutRate: '0.80', dataSource: 'yahoo', sourceSymbol: '^GDAXI', display: 'DAX 40' },
  { symbol: 'UK100', displayName: 'FTSE 100', baseAsset: 'UK100', quoteAsset: 'GBP', assetClass: 'INDEX', category: 'CFD', pricePrecision: 2, qtyPrecision: 2, minQty: '0.1', maxLeverage: 100, takerFee: '0.0015', makerFee: '0.0003', payoutRate: '0.80', dataSource: 'yahoo', sourceSymbol: '^FTSE', display: 'FTSE 100' },
];

const COMMODITIES: PairSeed[] = [
  { symbol: 'XAUUSD', displayName: 'Gold', baseAsset: 'XAU', quoteAsset: 'USD', assetClass: 'COMMODITY', category: 'CFD', pricePrecision: 2, qtyPrecision: 2, minQty: '0.01', maxLeverage: 100, takerFee: '0.0015', makerFee: '0.0003', payoutRate: '0.82', dataSource: 'yahoo', sourceSymbol: 'GC=F', display: 'Gold' },
  { symbol: 'XAGUSD', displayName: 'Silver', baseAsset: 'XAG', quoteAsset: 'USD', assetClass: 'COMMODITY', category: 'CFD', pricePrecision: 3, qtyPrecision: 2, minQty: '0.1', maxLeverage: 100, takerFee: '0.0018', makerFee: '0.0003', payoutRate: '0.80', dataSource: 'yahoo', sourceSymbol: 'SI=F', display: 'Silver' },
  { symbol: 'WTIUSD', displayName: 'Crude Oil (WTI)', baseAsset: 'WTI', quoteAsset: 'USD', assetClass: 'COMMODITY', category: 'CFD', pricePrecision: 3, qtyPrecision: 2, minQty: '0.1', maxLeverage: 50, takerFee: '0.0020', makerFee: '0.0004', payoutRate: '0.78', dataSource: 'yahoo', sourceSymbol: 'CL=F', display: 'Crude Oil (WTI)' },
  { symbol: 'NATGAS', displayName: 'Natural Gas', baseAsset: 'NG', quoteAsset: 'USD', assetClass: 'COMMODITY', category: 'CFD', pricePrecision: 4, qtyPrecision: 2, minQty: '1', maxLeverage: 50, takerFee: '0.0025', makerFee: '0.0005', payoutRate: '0.78', dataSource: 'yahoo', sourceSymbol: 'NG=F', display: 'Natural Gas' },
];

const CRYPTO = [
  { base: 'BTC', pricePrecision: 2, minQty: '0.0001', leverage: 100, fee: '0.0010', kraken: 'XBTUSDT', cb: 'BTC-USDT' },
  { base: 'ETH', pricePrecision: 2, minQty: '0.0010', leverage: 100, fee: '0.0010', kraken: 'ETHUSDT', cb: 'ETH-USDT' },
  { base: 'SOL', pricePrecision: 3, minQty: '0.010', leverage: 50, fee: '0.0010', kraken: 'SOLUSDT', cb: 'SOL-USDT' },
  { base: 'XRP', pricePrecision: 4, minQty: '1', leverage: 50, fee: '0.0010', kraken: 'XRPUSDT', cb: 'XRP-USDT' },
  { base: 'LTC', pricePrecision: 3, minQty: '0.010', leverage: 50, fee: '0.0010', kraken: 'LTCUSDT', cb: 'LTC-USDT' },
  { base: 'DOGE', pricePrecision: 5, minQty: '10', leverage: 50, fee: '0.0012', kraken: 'XDGUSDT', cb: 'DOGE-USDT' },
  { base: 'BNB', pricePrecision: 2, minQty: '0.010', leverage: 25, fee: '0.0010', kraken: 'BNBUSDT', cb: null },
  { base: 'ADA', pricePrecision: 5, minQty: '10', leverage: 50, fee: '0.0012', kraken: 'ADAUSDT', cb: 'ADA-USDT' },
  { base: 'TRX', pricePrecision: 5, minQty: '100', leverage: 25, fee: '0.0012', kraken: null, cb: null },
  { base: 'USDC', pricePrecision: 4, minQty: '10', leverage: 25, fee: '0.0010', kraken: 'USDCUSDT', cb: null },
];


export type SeedOptions = { includeSimulated?: boolean };

/** Upsert every reference instrument + the asset catalogue. Markets only. */
export async function seedMarkets(prisma: PrismaClient, opts: SeedOptions = {}): Promise<number> {
  let all: PairSeed[] = [
    ...FOREX.map(withDefaults),
    ...INDICES,
    ...COMMODITIES,
    ...CRYPTO.map((c) => ({
      symbol: `${c.base}/USDT`,
      displayName: `${c.base} / USDT`,
      baseAsset: c.base,
      quoteAsset: 'USDT',
      assetClass: 'CRYPTO' as const,
      category: 'SPOT' as const,
      pricePrecision: c.pricePrecision,
      qtyPrecision: 6,
      minQty: c.minQty,
      maxLeverage: 1,
      takerFee: c.fee,
      makerFee: '0.0004',
      dataSource: c.kraken ? 'kraken' : c.cb ? 'coinbase' : 'yahoo',
      sourceSymbol: c.kraken ?? c.cb ?? `${c.base}-USD`,
      display: `${c.base}/USDT`,
    })),
    ...CRYPTO.filter((c) => c.leverage >= 25).map((c) => ({
      symbol: `${c.base}/USDT-PERP`,
      displayName: `${c.base} / USDT Perpetual`,
      baseAsset: c.base,
      quoteAsset: 'USDT',
      assetClass: 'CRYPTO' as const,
      category: 'FUTURES' as const,
      pricePrecision: c.pricePrecision,
      qtyPrecision: 6,
      minQty: c.minQty,
      maxLeverage: c.leverage,
      takerFee: '0.0006',
      makerFee: '0.0002',
      dataSource: c.kraken ? 'kraken' : c.cb ? 'coinbase' : 'yahoo',
      sourceSymbol: c.kraken ?? c.cb ?? `${c.base}-USD`,
      display: `${c.base}-PERP`,
    })),
    ...['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAUUSD'].map((s) => {
      const s2 = [...FOREX.map(withDefaults), ...COMMODITIES].find((p) => p.symbol === s)!;
      return { ...s2, symbol: `${s}-BIN`, displayName: `${s2.displayName} (Short-Expiry)`, category: 'BINARY' as const, payoutRate: s2.payoutRate ?? '0.82' };
    }),
    ...CRYPTO.slice(0, 4).map((c) => ({
      symbol: `${c.base}/USDT-BIN`,
      displayName: `${c.base} / USDT (Short-Expiry)`,
      baseAsset: c.base,
      quoteAsset: 'USDT',
      assetClass: 'CRYPTO' as const,
      category: 'BINARY' as const,
      pricePrecision: c.pricePrecision,
      qtyPrecision: 6,
      minQty: '0.0001',
      maxLeverage: 1,
      takerFee: '0',
      makerFee: '0',
      payoutRate: '0.85',
      dataSource: c.kraken ? 'kraken' : c.cb ? 'coinbase' : 'yahoo',
      sourceSymbol: c.kraken ?? c.cb ?? `${c.base}-USD`,
      display: `${c.base}/USDT`,
    })),
  ];
  if (opts.includeSimulated === false) {
    all = all.filter((p) => p.category === 'FOREX' || (p.category === 'SPOT' && p.dataSource === 'kraken'));
  }
  for (const p of all) {
    await prisma.tradingPair.upsert({
      where: { symbol: p.symbol },
      create: {
        symbol: p.symbol, displayName: p.displayName, baseAsset: p.baseAsset, quoteAsset: p.quoteAsset,
        assetClass: p.assetClass, category: p.category, pricePrecision: p.pricePrecision, qtyPrecision: p.qtyPrecision,
        minQty: p.minQty, maxLeverage: p.maxLeverage, takerFee: p.takerFee, makerFee: p.makerFee,
        payoutRate: p.payoutRate ?? null, dataSource: p.dataSource, sourceSymbol: p.sourceSymbol ?? null, enabled: true,
      },
      update: {
        displayName: p.displayName, category: p.category, maxLeverage: p.maxLeverage, takerFee: p.takerFee,
        makerFee: p.makerFee, payoutRate: p.payoutRate ?? null, dataSource: p.dataSource, sourceSymbol: p.sourceSymbol ?? null,
      },
    });
  }
  const assets = new Set<string>(['USD', 'USDT']);
  all.forEach((p) => { assets.add(p.baseAsset); assets.add(p.quoteAsset); });
  for (const a of assets) {
    const cls = ['BTC', 'ETH', 'SOL', 'XRP', 'LTC', 'DOGE', 'BNB', 'ADA', 'TRX', 'USDC', 'USDT'].includes(a) ? 'CRYPTO'
      : ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'USD'].includes(a) ? 'FOREX'
      : ['NAS100', 'SPX500', 'US30', 'GER40', 'UK100'].includes(a) ? 'INDEX' : 'COMMODITY';
    await prisma.asset.upsert({ where: { symbol: a }, create: { symbol: a, name: a, assetClass: cls as never, decimals: 8 }, update: {} });
  }
  return all.length;
}
