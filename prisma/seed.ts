import { PrismaClient } from '@prisma/client';
import { seedMarkets } from './seed-data';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@vantamarkets.com';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Vanta!Admin2026';

async function main() {
  const reviewMarketsOnly = process.argv.includes('--review-markets-only');
  if (!reviewMarketsOnly && (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1')) {
    throw new Error('The development seed creates default staff accounts and is not allowed in production or Vercel. Use the market-only review seed on an isolated review database.');
  }
  console.log(reviewMarketsOnly ? 'Seeding reference market definitions for review…' : 'Seeding markets…');
  const markets = await seedMarkets(prisma, { includeSimulated: !reviewMarketsOnly });

  // System configuration + accounts
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      referralCode: 'VANTAADMIN',
      profile: { create: { firstName: 'Platform', lastName: 'Administrator', country: 'NG' } },
    },
    update: { role: 'SUPERADMIN', status: 'ACTIVE' },
  });

  const supportEmail = 'support@vantamarkets.com';
  await prisma.user.upsert({
    where: { email: supportEmail },
    create: {
      email: supportEmail,
      passwordHash: await bcrypt.hash(process.env.SEED_SUPPORT_PASSWORD || 'Vanta!Support2026', 12),
      role: 'SUPPORT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      referralCode: 'VANTASUPPORT',
      profile: { create: { firstName: 'Client', lastName: 'Desk', country: 'NG' } },
    },
    update: { role: 'SUPPORT', status: 'ACTIVE' },
  });

  console.log(`Seed complete. Markets: ${markets}. Admin: ${admin.email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
