import { NextRequest, NextResponse } from 'next/server';
import { backendUrls } from '@/lib/urls';
import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  readBackendResponseBody,
  setAuthCookies
} from '../_utils';

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

type PermissionsResponse = {
  ok: boolean;
  userId?: string | null;
};

const checkAccess = async (accessToken: string) => {
  const response = await fetch(backendUrls.auth.permissionsCheck, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store'
  });

  if (response.ok) {
    const data = await readBackendResponseBody<PermissionsResponse>(response);
    return { ok: true, data: (data && typeof data !== 'string' ? data : null) as PermissionsResponse | null };
  }

  return { ok: false, status: response.status };
};

const refreshTokens = async (refreshToken: string) => {
  const response = await fetch(backendUrls.auth.refresh, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store'
  });

  if (!response.ok) {
    return null;
  }

  const data = await readBackendResponseBody<RefreshResponse>(response);
  if (!data || typeof data === 'string') {
    return null;
  }

  return data;
};

export async function GET(request: NextRequest) {
  const accessToken = getAccessToken(request);
  const refreshToken = getRefreshToken(request);

  if (accessToken) {
    const permissions = await checkAccess(accessToken);
    if (permissions.ok) {
      return NextResponse.json({
        user: { id: permissions.data?.userId ?? undefined },
        accessToken,
        refreshToken
      });
    }

    if (permissions.status && permissions.status !== 401) {
      return NextResponse.json({ user: { id: undefined }, accessToken: null, refreshToken: null });
    }
  }

  if (!refreshToken) {
    const response = NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const refreshed = await refreshTokens(refreshToken);
  if (!refreshed) {
    const response = NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const response = NextResponse.json({ user: { id: undefined }, accessToken: null, refreshToken: null });
  setAuthCookies(response, refreshed.accessToken, refreshed.refreshToken);
  return response;
}
