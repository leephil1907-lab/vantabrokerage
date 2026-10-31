import fs from 'fs';
import path from 'path';

const dir = 'src/components/brand-icons';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.svg'));
const out = {};

for (const f of files) {
  const name = f.replace('.svg', '');
  let svg = fs.readFileSync(path.join(dir, f), 'utf8').trim();
  // Strip the XML declaration, role/title for compactness, keep viewBox + paths.
  svg = svg.replace(/<\?xml[^>]*\?>/g, '').replace(/<title>.*?<\/title>/g, '');
  out[name] = svg;
}

const pngs = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.png'))) {
  pngs[f.replace('.png', '')] = fs.readFileSync(path.join(dir, f)).toString('base64');
}

let ts = `/* eslint-disable */
/**
 * Official cryptocurrency brand marks (Simple Icons, CC0) and CoinGecko metadata images.
 * Rendering genuine asset branding — never generic circles or emoji — is mandatory.
 * Sources: https://simpleicons.org (Bitcoin, Ethereum, Solana, XRP, Litecoin, Dogecoin,
 * Binance, Cardano, Tether) and CoinGecko asset metadata images for TRON and USDC.
 */
export const CRYPTO_SVG: Record<string, string> = {\n`;
for (const [k, v] of Object.entries(out)) {
  ts += `  ${k}: ${JSON.stringify(v)},\n`;
}
ts += `};\n\nexport const CRYPTO_PNG: Record<string, string> = {\n`;
for (const [k, v] of Object.entries(pngs)) {
  ts += `  ${k}: 'data:image/png;base64,${v}',\n`;
}
ts += `};\n\n/** Brand colours used for tinting and fallbacks. */\nexport const ASSET_COLORS: Record<string, string> = {\n  BTC: '#F7931A', ETH: '#8C8CF9', SOL: '#9945FF', XRP: '#23292F', LTC: '#A6A9AA',\n  DOGE: '#C2A633', BNB: '#F3BA2F', ADA: '#0033AD', TRX: '#FF060A', USDC: '#2775CA', USDT: '#26A17B',\n  USD: '#2ee6a8', EUR: '#3b82f6', GBP: '#8b5cf6', JPY: '#ef4444', CHF: '#f43f5e', AUD: '#f59e0b', CAD: '#dc2626', NZD: '#0ea5e9',\n  XAU: '#d4af37', XAG: '#c0c0c0', WTI: '#4b5563', NG: '#38bdf8',\n  NAS100: '#0ea5e9', SPX500: '#22c55e', US30: '#3b82f6', GER40: '#f59e0b', UK100: '#8b5cf6',\n};\n`;
fs.writeFileSync('src/components/asset-marks.ts', ts);
console.log('written', Object.keys(out).length, 'svg marks and', Object.keys(pngs).length, 'png marks');
