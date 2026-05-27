import { NextRequest, NextResponse } from 'next/server';
import { backendUrls } from '@/lib/urls';
import { getRefreshToken, setAuthCookies } from '../_utils';

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export async function POST(request: NextRequest) {
  const refreshToken = getRefreshToken(request);
  if (!refreshToken) {
    return NextResponse.json({ message: 'Missing refresh token' }, { status: 401 });
  }

  const apiResponse = await fetch(backendUrls.auth.refresh, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store'
  });

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.json().catch(() => ({}));
    return NextResponse.json(errorBody, { status: apiResponse.status });
  }

  const data = (await apiResponse.json()) as RefreshResponse;
  const response = NextResponse.json({ ok: true });
  setAuthCookies(response, data.accessToken, data.refreshToken);

  return response;
}
