import { NextRequest, NextResponse } from 'next/server';
import { backendUrls } from '@/lib/urls';
import { getAccessToken, readBackendResponseBody } from '../auth/_utils';

export async function GET(request: NextRequest) {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ message: 'Missing access token' }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ message: 'projectId is required' }, { status: 400 });
  }

  const response = await fetch(`${backendUrls.rest}/channels?projectId=${encodeURIComponent(projectId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: 'no-store'
  });

  const data = await readBackendResponseBody(response);
  if (!response.ok) {
    return NextResponse.json(
      typeof data === 'string' ? { message: data } : data ?? { message: 'Failed to load channels' },
      { status: response.status }
    );
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ message: 'Missing access token' }, { status: 401 });
  }

  const body = await request.json();

  const response = await fetch(`${backendUrls.rest}/channels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  const data = await readBackendResponseBody(response);
  if (!response.ok) {
    return NextResponse.json(
      typeof data === 'string' ? { message: data } : data ?? { message: 'Failed to create channel' },
      { status: response.status }
    );
  }

  return NextResponse.json(data ?? {});
}
