import { NextRequest, NextResponse } from 'next/server';
import { backendUrls } from '@/lib/urls';
import { getRefreshToken, readBackendResponseBody, setAuthCookies } from '../_utils';

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
    const errorBody = await readBackendResponseBody<Record<string, unknown>>(apiResponse);
    return NextResponse.json(
      typeof errorBody === 'string'
        ? { message: errorBody }
        : errorBody ?? { message: 'Token refresh failed' },
      { status: apiResponse.status }
    );
  }

  const data = await readBackendResponseBody<RefreshResponse>(apiResponse);
  if (!data || typeof data === 'string') {
    return NextResponse.json(
      { message: 'Unexpected response from backend during token refresh' },
      { status: 502 }
    );
  }

  const response = NextResponse.json({ ok: true });
  setAuthCookies(response, data.accessToken, data.refreshToken);

  return response;
}
