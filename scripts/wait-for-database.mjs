import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const timeoutMs = 120_000;
const deadline = Date.now() + timeoutMs;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  let ready = false;
  while (!ready && Date.now() < deadline) {
    try {
      // These tables are created by the repository's committed migrations.
      await prisma.$queryRaw`SELECT 1 FROM "JobRun" LIMIT 1`;
      await prisma.$queryRaw`SELECT 1 FROM "TradingPair" LIMIT 1`;
      ready = true;
      console.log('[worker] database schema is ready');
    } catch {
      await pause(2_000);
    }
  }
  if (!ready) {
    throw new Error('Database schema did not become ready within 120 seconds.');
  }
}

main()
  .catch((error) => {
    console.error('[worker] database readiness check failed:', error instanceof Error ? error.message : 'unknown error');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
