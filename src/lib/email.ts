import { prisma } from './db';
import { renderEmailTemplate } from './email-templates';
import type { EmailTemplateKey, EmailTemplateVariables } from './email-templates';

/**
 * Email delivery writes a redacted audit copy to EmailOutbox. Action URLs and
 * one-time tokens are sent to the provider but are never persisted in the outbox.
 */
export function emailConfigured() {
  const provider = process.env.EMAIL_PROVIDER;
  if (provider === 'resend') return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  if (provider === 'webhook') return !!process.env.EMAIL_WEBHOOK_URL;
  return false;
}

function redactEmailBody(body: string) {
  return body
    .replace(/https?:\/\/[^\s]+/gi, '[secure link omitted]')
    .replace(/\b(token|code|secret)=?[^\s&]*/gi, '$1=[redacted]');
}

export async function queueEmail(input: { to: string; subject: string; body: string; html?: string; template?: string }) {
  const record = await prisma.emailOutbox.create({
    data: {
      to: input.to,
      subject: input.subject,
      body: redactEmailBody(input.body).slice(0, 12000),
      template: input.template ?? 'generic',
    },
  });
  if (!emailConfigured()) {
    await prisma.emailOutbox.update({ where: { id: record.id }, data: { status: 'FAILED', error: 'No email provider is configured. Request a fresh secure link after configuring delivery.' } });
    return { id: record.id, delivered: false as const, reason: 'no_provider' };
  }
  try {
    if (process.env.EMAIL_PROVIDER === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: [input.to],
          subject: input.subject,
          text: input.body,
          ...(input.html ? { html: input.html } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}: ${(await res.text()).slice(0, 500)}`);
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
    await prisma.emailOutbox.update({ where: { id: record.id }, data: { status: 'FAILED', error: String(err).slice(0, 1000) } });
    return { id: record.id, delivered: false as const, reason: String(err) };
  }
}

export async function queueTemplateEmail(input: {
  to: string;
  template: EmailTemplateKey;
  variables?: EmailTemplateVariables;
}) {
  const rendered = renderEmailTemplate(input.template, input.variables ?? {});
  return queueEmail({
    to: input.to,
    subject: rendered.subject,
    body: rendered.text,
    html: rendered.html,
    template: input.template,
  });
}
