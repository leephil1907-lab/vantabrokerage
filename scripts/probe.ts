import { fetchProviderQuote } from '../src/lib/market-data';
import { prisma } from '../src/lib/db';
(async () => {
  const pairs = await prisma.tradingPair.findMany({ where: { symbol: { in: ['EUR/USD','BTC/USDT','XBT'] } } });
  const all = await prisma.tradingPair.findMany();
  for (const p of all) {
    const t = Date.now();
    try { const q = await fetchProviderQuote(p); console.log(p.symbol.padEnd(14), p.dataSource.padEnd(9), q.last, q.source, Date.now()-t+'ms'); }
    catch (e:any) { console.log(p.symbol.padEnd(14), p.dataSource.padEnd(9), 'ERR', e.message); }
  }
  await prisma.$disconnect();
})();
