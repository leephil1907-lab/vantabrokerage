# PRIMEVEST transactional email

## Templates and delivery

The application uses `src/lib/email-templates.ts` and `src/lib/email.ts`. The template catalogue includes welcome, email verification, password reset, security alerts, deposit status, withdrawal status, KYC decisions, trade execution and support updates. Messages are rendered as HTML and plain text.

Configure one delivery provider in the server environment:

- Resend: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `EMAIL_FROM`.
- Trusted webhook: `EMAIL_PROVIDER=webhook` and `EMAIL_WEBHOOK_URL`.

Set `APP_URL` to the exact HTTPS origin for the environment so account links point to the correct site. Verify sender-domain ownership with the selected provider before sending real messages. Never expose provider credentials through client-side or `NEXT_PUBLIC_*` variables.

## Outbox and security

The outbox stores a redacted text copy: URLs and token-like values are removed before persistence. The original rendered message is sent to the configured provider but is not retained as an HTML copy in the outbox. Restrict access to outbox records and apply an appropriate retention policy.

A missing provider configuration is recorded as a failed delivery. A `SENT` status means the provider accepted the request; it does not prove delivery to the recipient's inbox. Provider delivery webhooks, bounce tracking and automatic retry processing are not implemented. Email failures must not reverse an already completed account action.

## Verification

Use the existing email-template preview page and isolated test environment to inspect rendered messages. Do not run tests that create database records against a customer or production database. Do not send test messages to customers; use an approved controlled mailbox.

Customer deposits and live execution remain disabled. Email notifications do not represent proof of a deposit, withdrawal settlement or trade execution.
