# PRIMEVEST transactional email

The shared renderer in `src/lib/email-templates.ts` provides branded HTML and plain-text versions for welcome, email verification (including resend), password reset, password change/reset confirmation, two-factor enabled/disabled, identity verification submitted/approved/rejected, and withdrawal requested/rejected/marked completed. The relevant existing event handlers send them only after the corresponding event occurs. KYC approval and withdrawal status messages do not promise access to live trading or prove settlement. Customer crypto deposits remain subject to manual finance review; live order execution remains disabled.

Open `docs/email-preview.html` to review all 12 templates. Its name and links are nonfunctional design placeholders, and it sends no messages. Rebuild it with `npx tsx scripts/create-email-preview.ts` after template changes. If the PNG logo changes, also run `node scripts/update-email-logo.mjs` to update the inline attachment, then rebuild the preview. The preview embeds the logo as a data URL so it works in an offline file viewer.

## Sending and branding

- Configure a verified sender domain and server-side `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` (for example `PRIMEVEST <notifications@your-verified-domain>`), and the correct HTTPS `APP_URL` for the environment. Never commit credentials or use `NEXT_PUBLIC_*` for secrets. Make sure verification and reset links point to the intended protected or production domain.
- Alternatively configure `EMAIL_PROVIDER=webhook` and `EMAIL_WEBHOOK_URL` for a trusted HTTPS service. The webhook receives the existing `to`, `subject`, `body`, `template`, plus `text`, `html`, and inline `attachments` (base64 `content`, `filename`, `content_id`). The webhook receiver must forward both HTML and the inline attachment; confirm its authentication, TLS, network and privacy controls independently. The current generic webhook does not add an authorization header.
- Resend receives both `html` and `text`, plus the selected PRIMEVEST logo as an inline CID PNG. A visible text wordmark is also included. Some email clients may block images or handle inline images differently; test major clients, mobile and dark/light modes before launch. Actual delivery and image rendering have not been tested with a real provider or mailbox.
- `EmailOutbox` stores the plain-text body, which can contain verification or reset links, plus delivery status. Restrict access, encrypt and apply a retention/deletion policy. The HTML and embedded image are not stored in the outbox.
- `SENT` / the legacy `delivered: true` response means the provider accepted the request, **not** that a recipient's mailbox delivered it. No delivery webhook or inbox tracking is implemented. No configured provider leaves records `QUEUED`; failed provider requests are marked `FAILED`. There is **no automatic retry worker**. Provider calls time out after 10 seconds; event-notification failures do not undo already completed account actions.
- Do not send identity documents, passwords, two-factor codes or financial account details in email. No custom or third-party input is trusted as HTML. User names are HTML-escaped; action links use the configured `APP_URL`, not the incoming host header.

## Verification

`ALLOW_DISPOSABLE_EMAIL_TEST=1 npx tsx scripts/test-email-templates.ts` exercises the renderer and mocked Resend/webhook payloads. It creates then removes test outbox records: **only run with an isolated disposable database**. The full end-to-end suite also creates accounts and financial fixtures and must never target customer data. A mock-provider test is not a real delivery test.

The templates are transactional, not marketing emails. Domain ownership and sender name remain subject to PRIMEVEST brand and legal clearance. See `docs/RENDER-DEPLOYMENT.md` for deployment prerequisites.
