import { NextResponse } from 'next/server';
import { getVersionInfo } from '@/lib/config/version';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const versionInfo = getVersionInfo();
  
  return NextResponse.json(versionInfo, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}