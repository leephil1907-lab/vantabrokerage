import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Render health check: verifies the HTTP process and its PostgreSQL connection.
 * Returns no credentials, hostnames, schema details, or raw database errors.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', database: 'connected' });
  } catch {
    return NextResponse.json(
      { status: 'error', database: 'unavailable' },
      { status: 503 },
    );
  }
}
