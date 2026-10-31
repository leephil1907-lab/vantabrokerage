import { prisma } from './db';

/**
 * Email delivery. When SMTP/provider credentials are configured (EMAIL_PROVIDER=resend
 * + RESEND_API_KEY, or EMAIL_PROVIDER=webhook + EMAIL_WEBHOOK_URL) messages are sent and
 * logged. Otherwise messages are queued in `EmailOutbox` and flagged as NOT_DELIVERED so
 * the UI can surface verification/reset links to developers without ever pretending an
 * email was delivered.
 */
export function emailConfigured() {
  const p = process.env.EMAIL_PROVIDER;
  if (p === 'resend') return !!process.env.RESEND_API_KEY;
  if (p === 'webhook') return !!process.env.EMAIL_WEBHOOK_URL;
  return false;
}

export async function queueEmail(input: { to: string; subject: string; body: string; template?: string }) {
  const record = await prisma.emailOutbox.create({
    data: { to: input.to, subject: input.subject, body: input.body, template: input.template ?? 'generic' },
  });
  if (!emailConfigured()) return { id: record.id, delivered: false as const, reason: 'no_provider' };
  try {
    if (process.env.EMAIL_PROVIDER === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.EMAIL_FROM || 'no-reply@vantamarkets.com', to: input.to, subject: input.subject, text: input.body }),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}`);
    } else if (process.env.EMAIL_PROVIDER === 'webhook') {
      const res = await fetch(process.env.EMAIL_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`Email webhook responded ${res.status}`);
    }
    await prisma.emailOutbox.update({ where: { id: record.id }, data: { status: 'SENT', sentAt: new Date() } });
    return { id: record.id, delivered: true as const };
  } catch (err) {
    await prisma.emailOutbox.update({ where: { id: record.id }, data: { status: 'FAILED', error: String(err) } });
    return { id: record.id, delivered: false as const, reason: String(err) };
  }
}
