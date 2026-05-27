import { NextRequest, NextResponse } from 'next/server';
import { backendUrls } from '@/lib/urls';
import { getAccessToken, readBackendResponseBody } from '../auth/_utils';

export async function GET(request: NextRequest) {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ message: 'Missing access token' }, { status: 401 });
  }

  const channelId = request.nextUrl.searchParams.get('channelId');
  const limit = request.nextUrl.searchParams.get('limit') ?? '50';
  const offset = request.nextUrl.searchParams.get('offset') ?? '0';

  if (!channelId) {
    return NextResponse.json({ message: 'channelId is required' }, { status: 400 });
  }

  const url = `${backendUrls.rest}/messages?channelId=${encodeURIComponent(channelId)}&limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: 'no-store'
  });

  const data = await readBackendResponseBody(response);
  if (!response.ok) {
    return NextResponse.json(
      typeof data === 'string' ? { message: data } : data ?? { message: 'Failed to load messages' },
      { status: response.status }
    );
  }

  return NextResponse.json(data ?? { messages: [], total: 0 });
}

export async function POST(request: NextRequest) {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ message: 'Missing access token' }, { status: 401 });
  }

  const body = await request.json();
  const response = await fetch(`${backendUrls.rest}/messages`, {
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
      typeof data === 'string' ? { message: data } : data ?? { message: 'Failed to send message' },
      { status: response.status }
    );
  }

  return NextResponse.json(data ?? {});
}
