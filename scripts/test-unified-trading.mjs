// Data-writing UI checks: only run against the isolated disposable server and database.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL || 'http://127.0.0.1:3001';
if(base!=='http://127.0.0.1:3001' || process.env.ALLOW_DISPOSABLE_REVIEW_TEST!=='1') throw Error('Requires disposable local test server');
const empty=process.env.EXPECT_EMPTY_MARKETS==='1';
const browser=await chromium.launch({args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base, {waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'Forex trading sessions'}).waitFor();
 assert.equal(await page.locator('#market-sessions .session-card').count(),4);
 assert.match(await page.locator('#market-sessions').innerText(),/Holidays and venue schedules are not included/);
 assert.ok((await page.getByRole('link',{name:'Open trading workspace'}).getAttribute('href')).includes('next='));
 await page.goto(base+'/register');
 const reg=await page.evaluate(async()=>{const r=await fetch('/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:`unified.${Date.now()}@example.test`,password:'Review!Test2026',firstName:'Unified',lastName:'Test',country:'Nigeria',acceptTerms:true})});return r.status}); assert.equal(reg,201);
 await page.goto(base+'/dashboard/trade',{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'Multi-asset trading'}).waitFor(); await page.getByRole('heading',{name:'Forex trading sessions'}).waitFor();
 if(empty) {
  await page.locator('.reference-chooser:visible').waitFor();
  assert.match(await page.locator('.reference-chooser:visible').innerText(),/No configured instruments/);
  await page.locator('.reference-chooser:visible').getByRole('button',{name:/EUR\/USD/}).click();
  assert.ok(await page.locator('.tv-shell:visible').count());
  await page.getByText('Reference-only chart.',{exact:false}).first().waitFor();
 } else {
  await page.getByRole('button',{name:'FX',exact:true}).click();
  const eur=page.getByRole('button',{name:'Select EUR/USD'}); await eur.waitFor(); await eur.focus(); await eur.press('Enter');
  assert.equal(await eur.getAttribute('aria-pressed'),'true');
  await page.getByText('EUR/USD · Order matching').first().waitFor();
  await page.getByRole('button',{name:'Spot',exact:true}).click();
  await page.getByRole('button',{name:'Select BTC/USDT'}).click();
  await page.getByText('BTC/USDT · Order matching').first().waitFor();
  assert.equal(await page.getByRole('button',{name:'Trading unavailable'}).first().isDisabled(),true);
  await page.getByText('Kraken · BTC/USDT · external venue').first().waitFor();
  const account=await page.evaluate(async()=>{const a=await (await fetch('/api/accounts')).json();return a.accounts[0].id});
  const order=await page.evaluate(async id=>{const r=await fetch('/api/trades/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accountId:id,symbol:'BTC/USDT',side:'BUY',type:'MARKET',qty:.001})});return {status:r.status,body:await r.json()}},account);
  assert.equal(order.status,409); assert.equal(order.body.error.code,'LIVE_EXECUTION_UNAVAILABLE');
  await page.route('**/api/trades/orders?*',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.reload(); await page.getByText('Some account records could not be refreshed.',{exact:false}).first().waitFor();
 }
 await page.screenshot({path:`/home/user/unified-${empty?'empty':'seeded'}.png`});
 for(const width of [320,390,768]){await page.setViewportSize({width,height:900});await page.reload();await page.getByRole('heading',{name:'Multi-asset trading'}).waitFor();await page.waitForTimeout(600);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=2),`overflow at ${width}`)}
 assert.deepEqual(errors,[]); console.log(`PASS: ${empty?'empty catalogue reference fallback':'multi-asset filtering, keyboard selection, account refresh and blocked execution'}, sessions and responsive layout`);
} finally {await browser.close()}
