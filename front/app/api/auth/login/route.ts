import { NextRequest, NextResponse } from 'next/server';
import { backendUrls } from '@/lib/urls';
import { readBackendResponseBody, setAuthCookies } from '../_utils';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user?: {
    id: string;
    email: string;
    username: string;
    displayName: string;
  };
};

export async function POST(request: NextRequest) {
  const body = await request.json();

  const apiResponse = await fetch(backendUrls.auth.login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  if (!apiResponse.ok) {
    const errorBody = await readBackendResponseBody<Record<string, unknown>>(apiResponse);
    return NextResponse.json(
      typeof errorBody === 'string'
        ? { message: errorBody }
        : errorBody ?? { message: 'Login failed' },
      { status: apiResponse.status }
    );
  }

  const data = await readBackendResponseBody<LoginResponse>(apiResponse);
  if (!data || typeof data === 'string') {
    return NextResponse.json(
      { message: 'Unexpected response from backend during login' },
      { status: 502 }
    );
  }

  const response = NextResponse.json({
    user: data.user ?? null,
    accessToken: data.accessToken
  });
  setAuthCookies(response, data.accessToken, data.refreshToken);

  return response;
}
