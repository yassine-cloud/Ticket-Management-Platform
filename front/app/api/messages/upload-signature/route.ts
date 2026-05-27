import { NextRequest, NextResponse } from 'next/server';
import { backendUrls } from '@/lib/urls';
import { getAccessToken, readBackendResponseBody } from '../../auth/_utils';

export async function POST(request: NextRequest) {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ message: 'Missing access token' }, { status: 401 });
  }

  const response = await fetch(`${backendUrls.rest}/messages/upload-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  const data = await readBackendResponseBody(response);
  if (!response.ok) {
    return NextResponse.json(
      typeof data === 'string' ? { message: data } : data ?? { message: 'Failed to create upload signature' },
      { status: response.status }
    );
  }

  return NextResponse.json(data ?? {});
}