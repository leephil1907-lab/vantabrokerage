import { NextResponse } from 'next/server';
import { getCryptoDiscovery } from '@/lib/coingecko';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getCryptoDiscovery();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[crypto-discovery] provider unavailable:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Crypto market data is temporarily unavailable. Please try again.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
