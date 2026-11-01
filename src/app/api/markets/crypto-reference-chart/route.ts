import { NextRequest, NextResponse } from 'next/server';
import { getReferenceChart, REFERENCE_ASSETS, type ReferenceAsset } from '@/lib/crypto-reference-chart';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const asset = new URL(req.url).searchParams.get('asset') ?? '';
  if (!REFERENCE_ASSETS.includes(asset as ReferenceAsset)) return NextResponse.json({ error: 'Unsupported reference asset.' }, { status: 400 });
  try {
    const result = await getReferenceChart(asset as ReferenceAsset);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Reference chart is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
