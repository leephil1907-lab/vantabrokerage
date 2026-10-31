import { prisma } from './db';
import { renderEmail, type EmailEvent } from './email-templates';
import { EMAIL_LOGO_BASE64 } from './email-logo';

/** Provider acceptance is not proof of mailbox delivery. Outbox bodies may contain
 * sensitive links; there is currently no retry worker or provider delivery webhook. */
export function emailConfigured() {
  const p = process.env.EMAIL_PROVIDER;
  if (p === 'resend') return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  if (p === 'webhook') return !!process.env.EMAIL_WEBHOOK_URL;
  return false;
}

export async function queueEmail(input: { to: string; subject: string; body: string; html?: string; template?: string }) {
  // Retain the plain-text body for support and existing token workflows. Do not
  // store a second copy of the sensitive link in HTML in the database.
  const record = await prisma.emailOutbox.create({
    data: { to: input.to, subject: input.subject, body: input.body, template: input.template ?? 'generic' },
  });
  if (!emailConfigured()) return { id: record.id, delivered: false as const, reason: 'no_provider' };
  try {
    const attachments = input.html?.includes('cid:primevest-logo') ? [{ filename: 'primevest-mark.png', content: EMAIL_LOGO_BASE64, content_id: 'primevest-logo' }] : undefined;
    if (process.env.EMAIL_PROVIDER === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.EMAIL_FROM, to: input.to, subject: input.subject, text: input.body, ...(input.html ? { html: input.html } : {}), ...(attachments ? { attachments } : {}) }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}`);
    } else if (process.env.EMAIL_PROVIDER === 'webhook') {
      const res = await fetch(process.env.EMAIL_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Keep body for existing webhook consumers and add html and text.
        body: JSON.stringify({ ...input, text: input.body, ...(attachments ? { attachments } : {}) }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`Email webhook responded ${res.status}`);
    }
    await prisma.emailOutbox.update({ where: { id: record.id }, data: { status: 'SENT', sentAt: new Date() } });
    return { id: record.id, delivered: true as const };
  } catch (err) {
    // Do not persist provider response bodies or credentials in logs or the database.
    await prisma.emailOutbox.update({ where: { id: record.id }, data: { status: 'FAILED', error: 'Email provider request failed.' } });
    return { id: record.id, delivered: false as const, reason: 'provider_error' };
  }
}

export async function sendEventEmail(to: string, event: EmailEvent, options: { firstName?: string | null; token?: string } = {}) {
  const message = renderEmail(event, { ...options, logoUrl: 'cid:primevest-logo' });
  return queueEmail({ to, subject: message.subject, body: message.text, html: message.html, template: message.template });
}

/** Best-effort notifications must never undo an already committed account event. */
export async function notifyUserByEmail(userId: string, event: EmailEvent) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, profile: { select: { firstName: true } } } });
    if (user) await sendEventEmail(user.email, event, { firstName: user.profile?.firstName });
  } catch {
    // Avoid leaking addresses, tokens, request content or provider secrets.
    console.error(`[email] Could not create ${event} notification.`);
  }
}
