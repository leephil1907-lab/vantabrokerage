import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fail, json, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { AppError } from '@/lib/errors';

const schema = z.object({
  fullName: z.string().trim().min(3).max(120),
  dateOfBirth: z.string().trim().min(8),
  documentType: z.enum(['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE']),
  documentNumber: z.string().trim().min(3).max(40),
  documentCountry: z.string().trim().min(2).max(60),
  address: z.string().trim().min(5).max(200),
  documents: z.array(z.object({ label: z.string(), filename: z.string(), dataUrl: z.string().startsWith('data:').max(3_000_000) })).max(4).default([]),
});

export async function GET() {
  try {
    const user = await requireUser();
    const kyc = await prisma.kycRecord.findUnique({ where: { userId: user.id } });
    return json({
      kyc: kyc ? {
        status: kyc.status, level: kyc.level, documentType: kyc.documentType, documentCountry: kyc.documentCountry,
        fullName: kyc.fullName, submittedAt: kyc.submittedAt?.toISOString() ?? null, reviewedAt: kyc.reviewedAt?.toISOString() ?? null,
        rejectionReason: kyc.rejectionReason, documents: kyc.documents,
      } : { status: 'NOT_SUBMITTED' },
    });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await parseBody(req, schema);
    const existing = await prisma.kycRecord.findUnique({ where: { userId: user.id } });
    if (existing && ['PENDING', 'APPROVED'].includes(existing.status)) {
      throw new AppError('KYC_LOCKED', existing.status === 'APPROVED' ? 'Your identity is already verified.' : 'Your verification is already under review.', 409);
    }
    const record = await prisma.kycRecord.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id, status: 'PENDING', fullName: body.fullName, dateOfBirth: new Date(body.dateOfBirth),
        documentType: body.documentType, documentNumber: body.documentNumber, documentCountry: body.documentCountry,
        address: body.address, documents: body.documents as never, submittedAt: new Date(),
      },
      update: {
        status: 'PENDING', fullName: body.fullName, dateOfBirth: new Date(body.dateOfBirth),
        documentType: body.documentType, documentNumber: body.documentNumber, documentCountry: body.documentCountry,
        address: body.address, documents: body.documents as never, submittedAt: new Date(), rejectionReason: null,
      },
    });
    await prisma.notification.create({ data: { userId: user.id, type: 'ACCOUNT', title: 'Verification submitted', body: 'Your identity documents are queued for compliance review.' } });
    return json({ kyc: { status: record.status, submittedAt: record.submittedAt?.toISOString() ?? null } }, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}
