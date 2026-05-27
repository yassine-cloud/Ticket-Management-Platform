import { NextRequest, NextResponse } from 'next/server';
import { backendUrls } from '@/lib/urls';
import { clearAuthCookies, getRefreshToken } from '../_utils';

export async function POST(request: NextRequest) {
  const refreshToken = getRefreshToken(request);

  if (refreshToken) {
    await fetch(backendUrls.auth.logout, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store'
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
