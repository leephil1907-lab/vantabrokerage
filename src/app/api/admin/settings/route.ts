import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { clientIp, fail, json, parseBody } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const configs = await prisma.systemConfig.findMany({ orderBy: { category: 'asc' } });
    return json({
      configs: configs.map((c) => ({ key: c.key, value: c.value, category: c.category, updatedAt: c.updatedAt.toISOString() })),
      environment: {
        executionMode: process.env.EXECUTION_MODE ?? 'paper',
        marketDataMode: process.env.MARKET_DATA_MODE ?? 'live',
        emailProvider: process.env.EMAIL_PROVIDER ?? null,
        custodyProvider: process.env.CUSTODY_PROVIDER ?? null,
        paymentProvider: process.env.PAYMENT_PROVIDER ?? null,
        kycProvider: process.env.KYC_PROVIDER ?? null,
        appUrl: process.env.APP_URL ?? null,
      },
    });
  } catch (err) {
    return fail(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseBody(req, z.object({ updates: z.array(z.object({ key: z.string().min(2), value: z.unknown(), category: z.string().optional() })) }));
    for (const u of body.updates) {
      const before = await prisma.systemConfig.findUnique({ where: { key: u.key } });
      await prisma.systemConfig.upsert({
        where: { key: u.key },
        create: { key: u.key, value: u.value as never, category: u.category ?? 'general', updatedById: admin.id },
        update: { value: u.value as never, ...(u.category ? { category: u.category } : {}), updatedById: admin.id },
      });
      await audit({ actorId: admin.id, action: 'config.update', targetType: 'SystemConfig', targetId: u.key, before: before?.value ?? null, after: u.value, ip: clientIp(req) });
    }
    return json({ ok: true, updated: body.updates.length });
  } catch (err) {
    return fail(err);
  }
}
