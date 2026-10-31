// Mutates a disposable database. Provider calls are intercepted; NO email is sent.
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { renderEmail, type EmailEvent } from '../src/lib/email-templates';
import { sendEventEmail } from '../src/lib/email';

if (process.env.ALLOW_DISPOSABLE_EMAIL_TEST !== '1') throw new Error('Set ALLOW_DISPOSABLE_EMAIL_TEST=1 only with an isolated disposable database.');
const db = new PrismaClient();
const originalFetch = globalThis.fetch;
const to = `email.test.${Date.now()}@example.test`;
const events: EmailEvent[] = ['welcome','verify_email','reset_password','password_changed','two_factor_enabled','two_factor_disabled','identity_submitted','identity_approved','identity_rejected','withdrawal_requested','withdrawal_rejected','withdrawal_completed'];
async function main() {
  for (const event of events) {
    const msg = renderEmail(event, { origin: 'https://review.example.test', firstName: '<script>&"', ...(['verify_email', 'reset_password'].includes(event) ? { token: 'test_token_abc123456' } : {}) });
    assert.match(msg.html, /PRIMEVEST/);
    assert.match(msg.text, /PRIMEVEST/);
    assert.match(msg.html, /&lt;script&gt;&amp;&quot;/);
    assert.ok(!msg.html.includes('<script>'));
    assert.match(msg.html, /https:\/\/review\.example\.test/);
    assert.ok(msg.subject.length > 0);
    if (event === 'verify_email' || event === 'reset_password') assert.match(msg.text, /token=test_token_abc123456/);
  }
  assert.throws(() => renderEmail('verify_email', { origin: 'https://review.example.test', token: '"><script>' }));
  assert.throws(() => renderEmail('welcome', { origin: 'javascript:alert(1)' }));
  assert.throws(() => renderEmail('welcome', { origin: 'https://example.test/path' }));
  process.env.APP_URL = 'https://review.example.test';
  process.env.EMAIL_PROVIDER = 'resend';
  process.env.RESEND_API_KEY = 'test_not_a_real_key';
  process.env.EMAIL_FROM = 'PRIMEVEST <review@example.test>';
  let calls: { url: string; body: any }[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify({ id: 'accepted-test' }), { status: 200 });
  }) as typeof fetch;
  let result = await sendEventEmail(to, 'verify_email', { firstName: 'Alex', token: 'test_token_abc123456' });
  assert.equal(result.delivered, true); // provider accepted; not proof of inbox delivery
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.match(calls[0].body.html, /cid:primevest-logo/);
  assert.match(calls[0].body.text, /verify-email\?token=test_token_abc123456/);
  assert.equal(calls[0].body.attachments[0].content_id, 'primevest-logo');
  assert.ok(Buffer.from(calls[0].body.attachments[0].content, 'base64').subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
  const stored = await db.emailOutbox.findUniqueOrThrow({ where: { id: result.id } });
  assert.equal(stored.template, 'verify_email'); assert.equal(stored.status, 'SENT');
  assert.match(stored.body, /verify-email\?token=test_token_abc123456/);
  assert.ok(!stored.body.includes('<html'));

  process.env.EMAIL_PROVIDER = 'webhook'; process.env.EMAIL_WEBHOOK_URL = 'https://test-webhook.example.test/send'; calls = [];
  result = await sendEventEmail(to, 'welcome');
  assert.equal(result.delivered, true);
  assert.match(calls[0].body.html, /cid:primevest-logo/);
  assert.equal(calls[0].body.body, calls[0].body.text);
  assert.equal(calls[0].body.attachments[0].content_id, 'primevest-logo');

  globalThis.fetch = (async () => new Response('secret provider detail', { status: 500 })) as typeof fetch;
  result = await sendEventEmail(to, 'two_factor_disabled');
  assert.equal(result.delivered, false);
  const failed = await db.emailOutbox.findUniqueOrThrow({ where: { id: result.id } });
  assert.equal(failed.status, 'FAILED'); assert.ok(!String(failed.error).includes('secret provider detail'));

  process.env.EMAIL_PROVIDER = '';
  result = await sendEventEmail(to, 'identity_submitted');
  assert.equal(result.delivered, false);
  const queued = await db.emailOutbox.findUniqueOrThrow({ where: { id: result.id } });
  assert.equal(queued.status, 'QUEUED');
  console.log('PASS: 12 branded templates, escaping and safe URLs, plain text, inline logo, mocked Resend/webhook delivery, failed/unconfigured states');
}
main().finally(async () => { globalThis.fetch = originalFetch; await db.emailOutbox.deleteMany({ where: { to } }); await db.$disconnect(); }).catch(e => { console.error(e); process.exit(1); });
