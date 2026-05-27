import { NextRequest, NextResponse } from 'next/server';
import { backendUrls } from '@/lib/urls';
import { readBackendResponseBody } from '../_utils';

type RegisterResponse = {
  id: string;
  email: string;
  username: string;
  displayName: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json();

  const apiResponse = await fetch(backendUrls.auth.register, {
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
        : errorBody ?? { message: 'Registration failed' },
      { status: apiResponse.status }
    );
  }

  const data = await readBackendResponseBody<RegisterResponse>(apiResponse);
  if (!data || typeof data === 'string') {
    return NextResponse.json(
      { message: 'Unexpected response from backend during registration' },
      { status: 502 }
    );
  }

  return NextResponse.json({ user: data });
}
