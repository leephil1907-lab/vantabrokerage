import { PrismaClient } from '@prisma/client';
import { seedMarkets } from './seed-data';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@vantamarkets.com';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Vanta!Admin2026';

const depositAddresses = {
  'BTC:Bitcoin': { address: 'bc1qjaargqate7yvacq065t0wtv64as85k7td2aqh0', network: 'Bitcoin', provider: 'manual-review', minConfirmations: 3 },
  'ETH:Ethereum': { address: '0x8703180060f0f92e319a4406c1324a71c6647903', network: 'Ethereum', provider: 'manual-review', minConfirmations: 12 },
  'USDT:ERC20': { address: '0x8703180060f0f92e319a4406c1324a71c6647903', network: 'ERC20', provider: 'manual-review', minConfirmations: 12 },
  'USDT:TRC20': { address: 'TSFPrRStowD5VMZBAsHZ2JPZ6pjyKMTCp1', network: 'TRC20', provider: 'manual-review', minConfirmations: 20 },
  'SOL:Solana': { address: 'EQR4wm7xFa6UMeCEpY5TTtCSFkcH83xcqiWwbxtyaAqF', network: 'Solana', provider: 'manual-review', minConfirmations: 32 },
  'DOGE:Dogecoin': { address: 'DD52RyrB4m7G5aZXtkX6FKmf73pFp2i7Sd', network: 'Dogecoin', provider: 'manual-review', minConfirmations: 20 },
  'TRX:Tron': { address: 'TSFPrRStowD5VMZBAsHZ2JPZ6pjyKMTCp1', network: 'Tron', provider: 'manual-review', minConfirmations: 20 },
};

async function main() {
  const reviewMarketsOnly = process.argv.includes('--review-markets-only');
  if (!reviewMarketsOnly && (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1')) {
    throw new Error('The development seed creates default staff accounts and is not allowed in production or Vercel. Use the market-only review seed on an isolated review database.'); 
  }
  console.log(reviewMarketsOnly ? 'Seeding reference market definitions and funding configuration…' : 'Seeding markets…');
  const markets = await seedMarkets(prisma, { includeSimulated: !reviewMarketsOnly });

  // Seed addresses once. update:{} deliberately preserves subsequent admin edits.
  await prisma.systemConfig.upsert({
    where: { key: 'funding.depositAddresses' },
    create: { key: 'funding.depositAddresses', category: 'funding', value: depositAddresses },
    update: {},
  });

  // The review/deployment seed never creates staff accounts or bootstrap credentials.
  if (reviewMarketsOnly) {
    console.log(`Reference market seed complete. Markets: ${markets}. No staff accounts were created.`);
    return;
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 12), role: 'SUPERADMIN', status: 'ACTIVE',
      emailVerifiedAt: new Date(), referralCode: 'VANTAADMIN',
      profile: { create: { firstName: 'Platform', lastName: 'Administrator', country: 'NG' } },
    },
    update: { role: 'SUPERADMIN', status: 'ACTIVE' },
  });

  const supportEmail = 'support@vantamarkets.com';
  await prisma.user.upsert({
    where: { email: supportEmail },
    create: {
      email: supportEmail, passwordHash: await bcrypt.hash(process.env.SEED_SUPPORT_PASSWORD || 'Vanta!Support2026', 12),
      role: 'SUPPORT', status: 'ACTIVE', emailVerifiedAt: new Date(), referralCode: 'VANTASUPPORT',
      profile: { create: { firstName: 'Client', lastName: 'Desk', country: 'NG' } },
    },
    update: { role: 'SUPPORT', status: 'ACTIVE' },
  });
  console.log(`Seed complete. Markets: ${markets}. Admin: ${admin.email}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
