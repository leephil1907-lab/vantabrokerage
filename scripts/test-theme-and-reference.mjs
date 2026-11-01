// Run only on a disposable server with an empty market catalogue.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
if (base !== 'http://127.0.0.1:3001' || process.env.ALLOW_DISPOSABLE_MARKET_TEST !== '1') throw new Error('Use only an isolated empty market server.');
const markets = await (await fetch(`${base}/api/markets`)).json();
assert.deepEqual(markets.markets, []);
assert.equal((await fetch(`${base}/api/markets/crypto-reference-chart?asset=../../foo`)).status, 400);
const now = new Date().toISOString();
// Test-only deterministic reference provider fixtures; never used by the application in production.
const feed = { source: 'CoinGecko', fetchedAt: now, stale: false, assets: [
  { id:'bitcoin', symbol:'BTC', name:'Bitcoin', image:null, rank:1, priceUsd:23456.78, change24h:1.25, marketCap:500000000, volume24h:1000000, updatedAt:now },
  { id:'ethereum', symbol:'ETH', name:'Ethereum', image:null, rank:2, priceUsd:1723.5, change24h:-0.5, marketCap:300000000, volume24h:900000, updatedAt:now },
  { id:'solana', symbol:'SOL', name:'Solana', image:null, rank:3, priceUsd:0.000000123456, change24h:0.1, marketCap:200000, volume24h:10000, updatedAt:now },
] };
const history = { asset:'bitcoin', currency:'USD', source:'CoinGecko', fetchedAt:now, stale:false, prices:[{time:1,price:23000},{time:2,price:23456.78}] };
const browser = await chromium.launch({ args:['--no-sandbox'] });
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport:{ width, height:900 }, reducedMotion:'reduce' });
    await page.route('**/api/markets/crypto-discovery', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(feed) }));
    await page.route('**/api/markets/crypto-reference-chart?*', route => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(history) }));
    await page.goto(base, { waitUntil:'domcontentloaded' });
    await page.getByText('CoinGecko · USD reference').first().waitFor();
    await page.getByText('24h USD reference · CoinGecko').first().waitFor();
    const hero = page.locator('.glass').first();
    assert.match(await hero.innerText(), /BTC\/USD/);
    assert.match(await hero.innerText(), /23,456\.78/);
    assert.doesNotMatch(await hero.innerText(), /Bid reference|Ask reference/);
    const overview = page.locator('section').filter({ has: page.getByRole('heading', { name:'The markets at a glance' }) });
    assert.match(await overview.innerText(), /Bitcoin/);
    assert.match(await overview.innerText(), /Ethereum/);
    assert.match(await overview.innerText(), /\$0\.000000123456/);
    assert.doesNotMatch(await overview.innerText(), /No market quotes are available/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 2), `overflow at ${width}`);
    const toggle = page.getByRole('button', { name:'Switch to light theme' });
    assert.equal(await toggle.count(), 1);
    await toggle.click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
    assert.equal(await page.evaluate(() => localStorage.getItem('primevest.theme')), 'light');
    await page.goto(`${base}/login`);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
    assert.equal(await page.getByRole('button', { name:'Switch to dark theme' }).count(), 1);
    await page.getByRole('button', { name:'Switch to dark theme' }).click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
    await page.close();
  }
  const context = await browser.newContext();
  const first = await context.newPage(), second = await context.newPage();
  await first.goto(base); await second.goto(`${base}/login`);
  await first.getByRole('button', { name:'Switch to light theme' }).click();
  await second.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  await context.close();
  const page = await browser.newPage({ viewport:{width:390,height:900} });
  await page.route('**/api/markets/crypto-discovery', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...feed,stale:true})}));
  await page.route('**/api/markets/crypto-reference-chart?*', route => route.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.goto(base);
  await page.getByText('Delayed reference').first().waitFor();
  await page.getByText('Chart data unavailable').first().waitFor();
  await page.close();
  console.log('PASS: responsive light/dark themes, persistence/cross-tab sync, real-data fallback labels, small-price precision, chart and stale/outage states');
} finally { await browser.close(); }
