// Refresh the server-safe inline attachment from the selected brand mark PNG.
import { readFileSync, writeFileSync } from 'node:fs';
const data = readFileSync('public/images/primevest-email-mark.png').toString('base64');
writeFileSync('src/lib/email-logo.ts', '// Generated from public/images/primevest-email-mark.png; regenerate if the brand mark changes.\nexport const EMAIL_LOGO_BASE64 = ' + JSON.stringify(data) + ';\n');
console.log('Updated inline email logo.');
