import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { clientIp, fail, json, parseBody } from '@/lib/http';
import { INITIAL_CRYPTO_DEPOSIT_ADDRESSES, type CryptoDepositAddress } from '@/lib/deposit-addresses';

export const dynamic = 'force-dynamic';
const addressSchema = z.object({
  asset: z.string().trim().min(2).max(12).regex(/^[A-Z0-9]+$/),
  network: z.string().trim().min(2).max(40),
  address: z.string().trim().min(20).max(200),
  enabled: z.boolean(),
  minConfirmations: z.coerce.number().int().min(1).max(500),
});

export async function GET() {
  try {
    await requireAdmin();
    const config = await prisma.systemConfig.findUnique({ where: { key: 'funding.cryptoAddresses' } });
    const addresses = Array.isArray(config?.value) ? config.value : INITIAL_CRYPTO_DEPOSIT_ADDRESSES;
    return json({ addresses, source: config ? 'database' : 'initial-configuration' });
  } catch (err) { return fail(err); }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseBody(req, z.object({ addresses: z.array(addressSchema).max(50) }));
    const seen = new Set<string>();
    for (const item of body.addresses) {
      const key = item.asset + ':' + item.network.toLowerCase();
      if (seen.has(key)) return json({ error: 'Each asset/network combination must be unique.' }, { status: 400 });
      seen.add(key);
    }
    const before = await prisma.systemConfig.findUnique({ where: { key: 'funding.cryptoAddresses' } });
    const value = body.addresses as CryptoDepositAddress[];
    await prisma.systemConfig.upsert({
      where: { key: 'funding.cryptoAddresses' },
      create: { key: 'funding.cryptoAddresses', category: 'funding', value: value as never, updatedById: admin.id },
      update: { value: value as never, category: 'funding', updatedById: admin.id },
    });
    await audit({ actorId: admin.id, action: 'funding.crypto_addresses.update', targetType: 'SystemConfig', targetId: 'funding.cryptoAddresses', before: before?.value ?? INITIAL_CRYPTO_DEPOSIT_ADDRESSES, after: value, ip: clientIp(req), userAgent: req.headers.get('user-agent') ?? undefined });
    return json({ ok: true, addresses: value });
  } catch (err) { return fail(err); }
}
