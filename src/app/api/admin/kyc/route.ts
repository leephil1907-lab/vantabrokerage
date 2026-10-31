import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    const status = new URL(req.url).searchParams.get('status') ?? 'PENDING';
    const records = await prisma.kycRecord.findMany({
      where: status === 'ALL' ? {} : { status: status as never },
      include: { user: { select: { email: true, createdAt: true, id: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });
    return json({ records: records.map((r) => ({ id: r.id, userId: r.userId, email: r.user.email, status: r.status, fullName: r.fullName, documentType: r.documentType, documentNumber: r.documentNumber, documentCountry: r.documentCountry, address: r.address, documents: r.documents, submittedAt: r.submittedAt?.toISOString() ?? null })) });
  } catch (err) {
    return fail(err);
  }
}
