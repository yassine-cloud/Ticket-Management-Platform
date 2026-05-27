import { NextRequest, NextResponse } from 'next/server';
import { backendUrls } from '@/lib/urls';
import { setAuthCookies } from '../_utils';

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
    const errorBody = await apiResponse.json().catch(() => ({}));
    return NextResponse.json(errorBody, { status: apiResponse.status });
  }

  const data = (await apiResponse.json()) as LoginResponse;
  const response = NextResponse.json({ user: data.user ?? null });
  setAuthCookies(response, data.accessToken, data.refreshToken);

  return response;
}
