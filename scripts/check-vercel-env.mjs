/**
 * Build-time configuration guard for the protected Vercel review deployment.
 * Prints variable names and generic guidance only, never secret values.
 */
const errors = [];
const db = process.env.DATABASE_URL?.trim() ?? '';
try {
  const url = new URL(db);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost' || host === '::1' || host === '0.0.0.0' || /^127\./.test(host)) throw new Error();
} catch { errors.push('DATABASE_URL must be a valid, non-local PostgreSQL connection URL.'); }

const directDb = process.env.DIRECT_URL?.trim() ?? '';
try {
  const url = new URL(directDb);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
  const host = url.hostname.toLowerCase().replace(/^\\[|\\]$/g, '');
  if (!host || host === 'localhost' || host === '::1' || host === '0.0.0.0' || /^127\\./.test(host)) throw new Error();
} catch { errors.push('DIRECT_URL must be a valid, non-local direct PostgreSQL connection URL for Prisma migrations.'); }

const secret = process.env.SESSION_SECRET ?? '';
if (secret.length < 32 || /replace|example|change.?me|your.?secret/i.test(secret)) {
  errors.push('SESSION_SECRET must be a unique randomly generated secret of at least 32 characters.');
}

try {
  const url = new URL(process.env.APP_URL ?? '');
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (url.protocol !== 'https:' || !host || host === 'localhost' || host === '::1' || host === '0.0.0.0' || /^127\./.test(host) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
} catch { errors.push('APP_URL must be the HTTPS origin of the protected deployment (no path, query or credentials).'); }

if (errors.length) {
  console.error('Vercel review build configuration is incomplete:');
  for (const error of errors) console.error(` - ${error}`);
  console.error('See docs/VERCEL-REVIEW-DEPLOYMENT.md.');
  process.exit(1);
}
console.log('Vercel review environment checks passed. This does not verify database connectivity, permissions, deployment protection or readiness for real funds.');
