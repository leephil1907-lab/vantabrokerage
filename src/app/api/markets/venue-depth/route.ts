import { NextRequest, NextResponse } from 'next/server';
import { getVenueDepth, isVenueSymbol } from '@/lib/venue-depth';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get('symbol') ?? '';
  if (!isVenueSymbol(symbol)) return NextResponse.json({ error: 'This venue pair is not supported.' }, { status: 400 });
  try { return NextResponse.json(await getVenueDepth(symbol), { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return NextResponse.json({ error: 'Kraken market depth is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
