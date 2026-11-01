/** Real browser auth tests against an explicitly opted-in, disposable local DB only. */
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { generateSecret, generateToken } from '../src/lib/totp';

const database = new URL(process.env.DATABASE_URL ?? '');
const base = process.env.BASE_URL ?? 'http://127.0.0.1:3001';
if (process.env.ALLOW_DISPOSABLE_ACCOUNT_TEST !== '1' || database.hostname !== '127.0.0.1' || database.pathname !== '/vanta_nodemo_test' || base !== 'http://127.0.0.1:3001') throw new Error('Requires isolated local vanta_nodemo_test and server on port 3001.');
const prisma = new PrismaClient();
const hash = (token: string) => createHash('sha256').update(token + (process.env.SESSION_SECRET ?? '')).digest('hex');
const email = `auth.${Date.now()}@example.test`;
async function main() {
  await prisma.rateLimitBucket.deleteMany({}); // disposable test DB: reset rate limits between runs
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  // Viewport sizing, responsive text/fields, reduced-motion navigation and overflow.
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    for (const path of ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']) {
      const res = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
      assert.equal(res?.status(), 200, path);
      const data = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, viewport: document.querySelector('meta[name=viewport]')?.getAttribute('content'), fieldSize: document.querySelector('input') ? parseFloat(getComputedStyle(document.querySelector('input')!).fontSize) : 16 }));
      assert.ok(data.overflow <= 2, `${path} ${width}px overflow ${data.overflow}`);
      assert.match(data.viewport ?? '', /width=device-width/);
      assert.ok(data.fieldSize >= 16, `${path} ${width}px input font ${data.fieldSize}`);
    }
    await page.goto(base + '/login');
    await page.getByRole('link', { name: /Create an account/ }).click();
    await page.getByRole('heading', { name: 'Create your account.' }).waitFor();
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(base + '/register');
  await page.getByLabel('First name').fill('Ada');
  await page.getByLabel('Last name').fill('Tester');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Create password').fill('abcdefghij');
  await page.getByRole('button', { name: 'Show password' }).click();
  assert.equal(await page.getByLabel('Create password').getAttribute('type'), 'text');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  assert.match(await page.locator('.auth-error').innerText(), /letter and a number/);
  await page.getByLabel('Create password').fill('Vanta!Test2026');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  const user = await prisma.user.findUniqueOrThrow({ where: { email }, include: { accounts: true } });
  assert.deepEqual(user.accounts.map(a => a.type).sort(), ['LIVE', 'PAPER']);
  const mail = await prisma.emailOutbox.findFirstOrThrow({ where: { to: email, template: 'verify_email' }, orderBy: { createdAt: 'desc' } });
  const link = mail.body.match(/https?:\/\/[^\s]+verify-email\?token=[^\s\\]+/)?.[0];
  assert.ok(link);
  const verifyToken = new URL(link).searchParams.get('token');
  assert.ok(verifyToken);
  await page.goto(`${base}/verify-email?token=${encodeURIComponent(verifyToken)}`);
  await page.getByText('Your email address is verified.').waitFor();
  assert.ok((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerifiedAt);
  assert.equal((await fetch(`${base}/api/auth/verify-email`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: verifyToken }) })).status, 400);
  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }));
  await page.goto(base + '/login');
  await page.getByLabel('Email address').fill(email); await page.getByLabel('Password', { exact: true }).fill('incorrect-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  assert.match(await page.locator('.auth-error').innerText(), /incorrect/i);
  await page.getByLabel('Password', { exact: true }).fill('Vanta!Test2026');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }));
  const secret = generateSecret();
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true, twoFactorSecret: secret } });
  await page.goto(base + '/login');
  await page.getByLabel('Email address').fill(email); await page.getByLabel('Password', { exact: true }).fill('Vanta!Test2026');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByLabel('Authenticator code').waitFor();
  await page.getByLabel('Authenticator code').fill(generateToken(secret));
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }));
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
  await page.goto(base + '/forgot-password');
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await page.getByRole('status').waitFor();
  const resetMail = await prisma.emailOutbox.findFirstOrThrow({ where: { to: email, template: 'reset_password' }, orderBy: { createdAt: 'desc' } });
  const resetLink = resetMail.body.match(/https?:\/\/[^\s]+reset-password\?token=[^\s\\]+/)?.[0];
  assert.ok(resetLink);
  const resetToken = new URL(resetLink).searchParams.get('token'); assert.ok(resetToken);
  await page.goto(`${base}/reset-password?token=${encodeURIComponent(resetToken)}`);
  await page.getByLabel('New password', { exact: true }).fill('NewPassword123');
  await page.getByLabel('Confirm password').fill('Mismatch1234');
  await page.getByRole('button', { name: 'Update password' }).click();
  assert.match(await page.locator('.auth-error').innerText(), /do not match/);
  await page.getByLabel('Confirm password').fill('NewPassword123');
  await page.getByRole('button', { name: 'Update password' }).click();
  await page.getByText('Your password has been updated.', { exact: false }).waitFor();
  await page.goto(base + '/login?next=%2F%2Fevil.example');
  await page.getByLabel('Email address').fill(email); await page.getByLabel('Password', { exact: true }).fill('NewPassword123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/dashboard');
  assert.equal(new URL(page.url()).origin, base, 'external redirect rejected');
  // Single-use token consumption is atomic, even with simultaneous submissions.
  for (const [kind, endpoint] of [['VERIFY_EMAIL', 'verify-email'], ['RESET_PASSWORD', 'reset-password']] as const) {
    const token = randomBytes(32).toString('base64url');
    await prisma.emailToken.create({ data: { userId: user.id, type: kind, tokenHash: hash(token), expiresAt: new Date(Date.now() + 60000) } });
    const body = kind === 'RESET_PASSWORD' ? { token, password: 'Concurrent1234' } : { token };
    const call = () => fetch(`${base}/api/auth/${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const status = (await Promise.all([call(), call()])).map(r => r.status).sort();
    assert.deepEqual(status, [200, 400], `${kind} concurrent token consumption`);
  }
  console.log('PASS: mobile/desktop layouts, reduced-motion route navigation, signup, validation, password visibility, email verification, sign-in, two-factor, reset, safe redirect and atomic single-use tokens.');
} finally { await browser.close(); await prisma.$disconnect(); }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
