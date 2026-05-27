import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

const isProduction = process.env.NODE_ENV === 'production';

const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction,
  path: '/'
};

export const getAccessToken = (request: NextRequest) =>
  request.cookies.get(ACCESS_COOKIE)?.value ??
  request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

export const getRefreshToken = (request: NextRequest) =>
  request.cookies.get(REFRESH_COOKIE)?.value;

export const setAuthCookies = (
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) => {
  response.cookies.set(ACCESS_COOKIE, accessToken, {
    ...baseCookieOptions,
    maxAge: 60 * 15
  });
  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 7
  });
};

export const clearAuthCookies = (response: NextResponse) => {
  response.cookies.set(ACCESS_COOKIE, '', {
    ...baseCookieOptions,
    maxAge: 0
  });
  response.cookies.set(REFRESH_COOKIE, '', {
    ...baseCookieOptions,
    maxAge: 0
  });
};

export const readBackendResponseBody = async <T>(response: Response): Promise<T | string | null> => {
  const rawBody = await response.text();
  if (!rawBody) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const looksJson = contentType.includes('application/json') || contentType.includes('+json');

  if (looksJson) {
    try {
      return JSON.parse(rawBody) as T;
    } catch {
      return rawBody;
    }
  }

  return rawBody;
};
