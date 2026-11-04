/**
 * ONE-TIME staff bootstrap for a fresh production database.
 * Gated twice: the STAFF_BOOTSTRAP token must be passed explicitly, and it
 * only acts when the database contains no SUPERADMIN yet — it can never
 * overwrite or reset an existing account. Remove the render.yaml pre-deploy
 * invocation once the first deployment has created the account.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const TOKEN = 'one-time-2026-11';
if (process.env.STAFF_BOOTSTRAP !== TOKEN) {
  console.log('bootstrap-staff: token not provided, skipping.');
  process.exit(0);
}

const prisma = new PrismaClient();
try {
  const existing = await prisma.user.count({ where: { role: 'SUPERADMIN' } });
  if (existing > 0) {
    console.log(`bootstrap-staff: ${existing} SUPERADMIN account(s) already exist; nothing created.`);
    process.exit(0);
  }
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@vantamarkets.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Vanta!Admin2026';
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      referralCode: 'VANTAADMIN',
      profile: { create: { firstName: 'Platform', lastName: 'Administrator', country: 'NG' } },
    },
  });
  console.log(`bootstrap-staff: created SUPERADMIN ${email} on an empty-staff database.`);
} finally {
  await prisma.$disconnect();
}
