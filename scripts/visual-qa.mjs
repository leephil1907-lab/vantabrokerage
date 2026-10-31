/**
 * Visual QA harness.
 *
 *   node scripts/visual-qa.mjs <path> [path...]      (screenshots to /tmp/shots)
 *
 * Captures desktop (1440x900) and mobile (390x844) screenshots, collects console
 * errors / failed requests / hydration warnings, and reports layout overflow.
 * Used to verify the design and motion spec against real rendered output.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const OUT = process.env.SHOT_DIR || '/tmp/shots';
mkdirSync(OUT, { recursive: true });

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('usage: node scripts/visual-qa.mjs / /markets ...');
  process.exit(1);
}

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const report = [];

for (const pathname of targets) {
  const problems = [];
  const consoleErrors = [];
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      userAgent: vp.name === 'mobile' ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' : undefined,
      isMobile: vp.name === 'mobile',
      hasTouch: vp.name === 'mobile',
    });
    const page = await ctx.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(`[${vp.name}] ${m.text().slice(0, 300)}`);
    });
    page.on('pageerror', (e) => consoleErrors.push(`[${vp.name}] pageerror: ${e.message.slice(0, 300)}`));
    page.on('requestfailed', (r) => {
      const u = r.url();
      if (/webgl|\.woff2?|_next\/static/.test(u) === false && !u.includes('favicon')) return;
      consoleErrors.push(`[${vp.name}] requestfailed ${u.slice(0, 120)}`);
    });

    const res = await page.goto(BASE + pathname, { waitUntil: 'networkidle', timeout: 60_000 }).catch((e) => ({ status: () => 'ERR ' + e.message.slice(0, 80) }));
    await page.waitForTimeout(2200);

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflowX = doc.scrollWidth - doc.clientWidth;
      const wide = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.right > window.innerWidth + 2 && getComputedStyle(el).position !== 'fixed';
        })
        .slice(0, 6)
        .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ').slice(0, 3).join('.')} right=${Math.round(el.getBoundingClientRect().right)}`);
      const missingImg = [...document.querySelectorAll('img')].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src.slice(0, 90));
      const emptySvg = [...document.querySelectorAll('svg')].filter((s) => !s.innerHTML.trim()).length;
      return { overflowX, wide, missingImg, emptySvg, canvases: document.querySelectorAll('canvas').length, height: doc.scrollHeight };
    });

    if (metrics.overflowX > 2) problems.push(`${vp.name}: horizontal overflow ${metrics.overflowX}px ${JSON.stringify(metrics.wide)}`);
    if (metrics.missingImg.length) problems.push(`${vp.name}: broken images ${JSON.stringify(metrics.missingImg)}`);
    if (metrics.emptySvg) problems.push(`${vp.name}: ${metrics.emptySvg} empty <svg>`);

    const file = path.join(OUT, `${pathname.replace(/\W+/g, '_') || 'home'}-${vp.name}.png`);
    // Infinite CSS animations (ticker, pulses) can stall Playwright's
    // font/animation stabilisation, so freeze them before capturing.
    await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused !important;animation-duration:.001ms !important;transition-duration:.001ms !important}' }).catch(() => {});
    await page.screenshot({ path: file, fullPage: vp.name === 'desktop', timeout: 60_000, animations: 'disabled', caret: 'hide' }).catch(async () => {
      await page.screenshot({ path: file, timeout: 60_000, animations: 'disabled' });
    });
    report.push({ pathname, viewport: vp.name, status: typeof res?.status === 'function' ? res.status() : res, file, metrics });
    await ctx.close();
  }
  if (consoleErrors.length) problems.push(...consoleErrors.slice(0, 8));
  report.push({ pathname, problems });
}

await browser.close();
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
for (const r of report) {
  if (r.problems) {
    console.log(`\n${r.pathname} — ${r.problems.length ? 'ISSUES' : 'clean'}`);
    r.problems.forEach((p) => console.log('  ·', p));
  } else {
    console.log(`${r.pathname} [${r.viewport}] ${r.status} → ${r.file} (canvas:${r.metrics.canvases})`);
  }
}
