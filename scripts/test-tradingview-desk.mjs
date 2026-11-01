// Write operations only against the isolated disposable test server.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
if (base !== 'http://127.0.0.1:3001' || process.env.ALLOW_DISPOSABLE_REVIEW_TEST !== '1') throw Error('Use an isolated test server');
const browser = await chromium.launch({args:['--no-sandbox']});
try {
 const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 await page.goto(base+'/register');
 const registered = await page.evaluate(async () => { const r=await fetch('/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:`tvtest.${Date.now()}@example.test`,password:'Review!Test2026',firstName:'Test',lastName:'User',country:'Nigeria',acceptTerms:true})});return r.status; });
 assert.equal(registered,201);
 await page.goto(base+'/dashboard/crypto',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'TradingView',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'TradingView',exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByText('Kraken · BTC/USDT · external venue').first().waitFor();
 await page.getByText('Order book unavailable').first().waitFor();
 await page.getByRole('button',{name:'Reference chart',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Reference chart',exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'TradingView',exact:true}).click();
 assert.ok(await page.locator('.tv-shell').count()>0);
 await page.screenshot({path:'/home/user/desk-tv.png'});
 await page.setViewportSize({width:390,height:844}); await page.goto(base+'/dashboard/crypto'); await page.waitForTimeout(1200);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth <= 2));
 assert.deepEqual(errors,[]);
 console.log('PASS: authenticated TradingView desk, reference switch, external BTC/USDT depth, unavailable internal order book, responsive layout');
} finally {await browser.close()}
