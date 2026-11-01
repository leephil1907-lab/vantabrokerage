import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
if (!/^http:\/\/127\.0\.0\.1:300[0-9]$/.test(base)) throw Error('Use a local test server only');
const valid = await fetch(`${base}/api/markets/venue-depth?symbol=BTC%2FUSD`);
const book = await valid.json();
assert.equal(valid.status,200,JSON.stringify(book)); assert.equal(book.source,'Kraken'); assert.equal(book.symbol,'BTC/USD'); assert.ok(book.bids.length && book.asks.length); assert.ok(book.bids[0].price <= book.asks[0].price); assert.ok(Date.now()-Date.parse(book.fetchedAt)<15000);
assert.equal((await fetch(`${base}/api/markets/venue-depth?symbol=${encodeURIComponent('../../example')}`)).status,400);
const browser = await chromium.launch({args:['--no-sandbox']});
try {
 for (const width of [320,390,768,1440]) {
  const page = await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}); const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'}); await page.getByRole('heading',{name:'Perspective for every move.'}).waitFor();
  assert.equal(await page.getByRole('button',{name:/Next slide|Previous slide|Pause slideshow|Play slideshow/}).count(),0,'hero carousel must not expose manual controls');
  await page.getByRole('heading',{name:'A wider world. One view.'}).waitFor({timeout:10000});
  assert.equal(await page.locator('.story-brand-stamp').count(),1);
  await page.getByRole('button',{name:'Solana',exact:false}).last().click();
  await page.waitForTimeout(1000); assert.match(await page.locator('.showcase-workspace').innerText(),/SOL\/USD/);
  await page.getByRole('button',{name:'Euro \/ US dollar',exact:false}).click();
  assert.match(await page.locator('.showcase-workspace').innerText(),/EUR\/USD/);
  assert.match(await page.locator('.showcase-workspace').innerText(),/available here for supported/);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth <= 2), `horizontal overflow ${width}`);
  if(width >= 1024) { const btn=page.getByRole('button',{name:'Trading',exact:true}); await btn.focus(); await btn.press('Enter'); assert.equal(await btn.getAttribute('aria-expanded'),'true'); await btn.press('Escape'); assert.equal(await btn.getAttribute('aria-expanded'),'false'); }
  else { const btn=page.getByRole('button',{name:'Open menu'}); await btn.click(); assert.equal(await page.getByRole('button',{name:'Close menu'}).getAttribute('aria-expanded'),'true'); assert.ok(await page.getByRole('link',{name:'Live charts',exact:true}).count()>=1); await page.getByRole('button',{name:'Close menu'}).click(); }
  await page.getByRole('button',{name:'Switch to light theme'}).click(); assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'light');
  await page.screenshot({path:`/home/user/motion-${width}-light.png`,fullPage:false});
  await page.getByRole('button',{name:'Switch to dark theme'}).click(); await page.screenshot({path:`/home/user/motion-${width}.png`,fullPage:false});
  assert.deepEqual(errors,[],`errors at ${width}: ${errors}`); await page.close();
 }
 const page = await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('**/s3.tradingview.com/**',route=>route.abort()); await page.route('**/api/markets/venue-depth?*',route=>route.fulfill({status:503,contentType:'application/json',body:'{}'}));
 await page.goto(base); await page.getByText('TradingView chart could not be loaded.').waitFor({timeout:18000}); await page.getByText('Market depth is temporarily unavailable.').waitFor(); assert.ok(await page.getByRole('button',{name:'Try again'}).count());
 await page.screenshot({path:'/home/user/motion-workspace.png',fullPage:true}); await page.close();
 console.log('PASS: live Kraken depth, input allowlist, responsive controls and theme, carousel, keyboard navigation, chart/depth failure states');
} finally {await browser.close()}
