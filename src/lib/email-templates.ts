export type EmailTemplateKey =
  | 'welcome'
  | 'verify_email'
  | 'reset_password'
  | 'security_alert'
  | 'deposit_pending'
  | 'deposit_approved'
  | 'deposit_rejected'
  | 'withdrawal_submitted'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'withdrawal_completed'
  | 'kyc_submitted'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'trade_executed'
  | 'support_update';

export type EmailTemplateVariables = Record<string, string | number | undefined>;

const BRAND = {
  name: 'PRIMEVEST',
  ink: '#101510',
  panel: '#192019',
  lime: '#D6F269',
  muted: '#9AA596',
  text: '#F5F6F0',
};

const CATALOG: Record<EmailTemplateKey, { subject: string; preheader: string; heading: string; intro: string; action?: string; footer: string }> = {
  welcome: { subject: 'Welcome to PRIMEVEST', preheader: 'Your account is ready.', heading: 'Welcome aboard', intro: 'Your PRIMEVEST account has been created. You can now sign in and complete your account setup.', action: 'Open PRIMEVEST', footer: 'For your security, never share your password or authentication codes.' },
  verify_email: { subject: 'Verify your PRIMEVEST email', preheader: 'Confirm your email address to secure your account.', heading: 'Confirm your email', intro: 'Please confirm that this email address belongs to you. The secure verification link expires in 24 hours.', action: 'Verify email address', footer: 'If you did not create a PRIMEVEST account, you can ignore this email.' },
  reset_password: { subject: 'Reset your PRIMEVEST password', preheader: 'A password reset was requested for your account.', heading: 'Reset your password', intro: 'We received a request to reset your PRIMEVEST password. This secure link expires in one hour.', action: 'Reset password', footer: 'If you did not request a reset, no action is needed. Your password will remain unchanged.' },
  security_alert: { subject: 'PRIMEVEST security notification', preheader: 'Important activity on your account.', heading: 'Security notification', intro: 'There has been a security-related event on your PRIMEVEST account. Review the details below and contact support if this was not you.', footer: 'PRIMEVEST will never ask you to disclose your password or one-time codes.' },
  deposit_pending: { subject: 'Your PRIMEVEST deposit is under review', preheader: 'We received your deposit submission.', heading: 'Deposit received', intro: 'Your deposit details have been submitted and are awaiting manual review. Your available balance has not been credited.', footer: 'Deposits are credited only after an authorized finance review and approval.' },
  deposit_approved: { subject: 'Your PRIMEVEST deposit was approved', preheader: 'Your deposit review is complete.', heading: 'Deposit approved', intro: 'Your deposit has been verified and approved by our finance team. The approved amount has been applied to your account balance.', footer: 'You can review the transaction in your account activity.' },
  deposit_rejected: { subject: 'Update on your PRIMEVEST deposit', preheader: 'Your deposit review requires your attention.', heading: 'Deposit not approved', intro: 'Our finance team could not approve this deposit submission. Review the details below and contact support if you need assistance.', footer: 'A rejected deposit does not increase your available balance.' },
  withdrawal_submitted: { subject: 'Your PRIMEVEST withdrawal request was received', preheader: 'Your withdrawal request is awaiting review.', heading: 'Withdrawal request received', intro: 'We have received your withdrawal request. It will be reviewed according to the account security and payout checks.', footer: 'We will notify you when the request status changes.' },
  withdrawal_approved: { subject: 'Your PRIMEVEST withdrawal was approved', preheader: 'Your withdrawal passed review.', heading: 'Withdrawal approved', intro: 'Your withdrawal request has been approved and is awaiting payout processing.', footer: 'Approval does not mean the blockchain transfer is complete.' },
  withdrawal_rejected: { subject: 'Update on your PRIMEVEST withdrawal', preheader: 'Your withdrawal request was not approved.', heading: 'Withdrawal not approved', intro: 'Your withdrawal request was not approved. Any funds reserved for this request have been handled according to the displayed account status.', footer: 'Contact support if you need clarification.' },
  withdrawal_completed: { subject: 'Your PRIMEVEST withdrawal is complete', preheader: 'Your withdrawal has been marked complete.', heading: 'Withdrawal completed', intro: 'Your withdrawal has been marked complete. The transaction reference is included below when available.', footer: 'Keep your transaction reference for your records.' },
  kyc_submitted: { subject: 'Your PRIMEVEST identity check was received', preheader: 'Your identity documents are awaiting review.', heading: 'Verification submitted', intro: 'Your identity verification details have been submitted and are awaiting review. Submission does not mean approval.', footer: 'You can check your verification status in your account. Never send identity documents by email.' },
  kyc_approved: { subject: 'Your PRIMEVEST identity check is approved', preheader: 'Your identity verification is complete.', heading: 'Identity verified', intro: 'Your identity verification has been approved. Your account will reflect the permissions associated with your verification level.', footer: 'Keep your account details up to date.' },
  kyc_rejected: { subject: 'Update on your PRIMEVEST identity check', preheader: 'Your identity verification needs attention.', heading: 'Verification needs attention', intro: 'We could not approve your identity verification. Review the reason below and follow the instructions in your account to resubmit if available.', footer: 'Contact support if you need help with the verification process.' },
  trade_executed: { subject: 'PRIMEVEST trade execution update', preheader: 'A trade on your account was executed.', heading: 'Trade executed', intro: 'A trade on your PRIMEVEST account has been executed. Review the execution details below.', footer: 'Trading involves risk. Review your positions and account activity regularly.' },
  support_update: { subject: 'There is an update to your PRIMEVEST support ticket', preheader: 'Your support request has an update.', heading: 'Support ticket update', intro: 'Our support team has added an update to your request. Sign in to review the latest response.', action: 'View support ticket', footer: 'Please reply through your PRIMEVEST support center to keep the conversation together.' },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}

function value(vars: EmailTemplateVariables, key: string, fallback = '') {
  const raw = vars[key];
  return raw === undefined || raw === null ? fallback : String(raw);
}

export function renderEmailTemplate(template: EmailTemplateKey, vars: EmailTemplateVariables = {}) {
  const definition = CATALOG[template];
  const firstName = value(vars, 'firstName', 'there');
  const requestedActionUrl = value(vars, 'actionUrl');
  let actionUrl = '';
  try {
    const parsed = new URL(requestedActionUrl);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') actionUrl = parsed.toString();
  } catch { /* An invalid action URL is omitted from the email. */ }
  const action = definition.action && actionUrl
    ? `<tr><td align="center" style="padding:28px 0 8px"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:${BRAND.lime};color:${BRAND.ink};font-weight:700;text-decoration:none;padding:14px 22px;border-radius:8px;font-size:14px">${escapeHtml(definition.action)}</a></td></tr>`
    : '';
  const details = Object.entries(vars)
    .filter(([key, val]) => val !== undefined && val !== '' && !['firstName', 'actionUrl'].includes(key))
    .map(([key, val]) => `<tr><td style="padding:9px 0;border-bottom:1px solid #2b352b;color:${BRAND.muted};font-size:12px">${escapeHtml(key.replace(/([A-Z])/g, ' $1'))}</td><td align="right" style="padding:9px 0;border-bottom:1px solid #2b352b;color:${BRAND.text};font-size:12px;font-weight:600">${escapeHtml(String(val))}</td></tr>`)
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(definition.subject)}</title></head><body style="margin:0;padding:32px 12px;background:#0c100c;font-family:Arial,Helvetica,sans-serif;color:${BRAND.text}"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(definition.preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto"><tr><td style="padding:8px 4px 22px"><span style="display:inline-block;border:1px solid #3a4a2c;border-radius:7px;padding:9px 12px;color:${BRAND.lime};font-size:15px;font-weight:800;letter-spacing:2px">${BRAND.name}</span></td></tr><tr><td style="background:${BRAND.panel};border:1px solid #2a352a;border-radius:14px;padding:34px 30px"><p style="margin:0 0 10px;color:${BRAND.lime};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Account notification</p><h1 style="margin:0 0 18px;color:${BRAND.text};font-size:26px;line-height:1.25">${escapeHtml(definition.heading)}</h1><p style="margin:0 0 16px;color:${BRAND.muted};font-size:14px;line-height:1.75">Hello ${escapeHtml(firstName)},</p><p style="margin:0;color:${BRAND.text};font-size:14px;line-height:1.75">${escapeHtml(definition.intro)}</p>${details ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-top:1px solid #2b352b">${details}</table>` : ''}<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${action}</table><p style="margin:26px 0 0;color:${BRAND.muted};font-size:11px;line-height:1.7">${escapeHtml(definition.footer)}</p></td></tr><tr><td style="padding:22px 8px;color:#738071;font-size:10px;line-height:1.7">© ${new Date().getUTCFullYear()} PRIMEVEST. This is an automated account notification. Please do not reply directly to this email.</td></tr></table></body></html>`;
  const lines = [
    `PRIMEVEST — ${definition.heading}`,
    `Hello ${firstName},`,
    definition.intro,
    ...Object.entries(vars).filter(([key, val]) => val !== undefined && val !== '' && !['firstName', 'actionUrl'].includes(key)).map(([key, val]) => `${key}: ${val}`),
    actionUrl ? `Continue: ${actionUrl}` : '',
    definition.footer,
  ].filter(Boolean);
  return { subject: definition.subject, html, text: lines.join('\n\n') };
}

export function listEmailTemplates() {
  return Object.entries(CATALOG).map(([key, item]) => ({ key, subject: item.subject, preheader: item.preheader }));
}
