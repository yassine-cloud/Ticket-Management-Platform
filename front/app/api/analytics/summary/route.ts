import { NextRequest, NextResponse } from 'next/server';
import { backendUrls } from '@/lib/urls';
import { getAccessToken, readBackendResponseBody } from '../../auth/_utils';

type TicketCounts = {
  total: number;
  open: number;
  closed: number;
};

type AverageResponseTime = {
  averageMinutes: number | null;
  sampleSize: number;
};

type SlaBreaches = {
  breaches: number;
  evaluatedTickets: number;
  responseTimeMinutes: number | null;
};

export async function GET(request: NextRequest) {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ message: 'Missing access token' }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get('projectId');
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';

  const headers = {
    Authorization: `Bearer ${accessToken}`
  };

  const [countsResponse, averageResponse, slaResponse] = await Promise.all([
    fetch(`${backendUrls.analytics.ticketCounts}${query}`, { headers, cache: 'no-store' }),
    fetch(`${backendUrls.analytics.averageResponseTime}${query}`, { headers, cache: 'no-store' }),
    fetch(`${backendUrls.analytics.slaBreaches}${query}`, { headers, cache: 'no-store' })
  ]);

  if (!countsResponse.ok) {
    const errorBody = await readBackendResponseBody<Record<string, unknown>>(countsResponse);
    return NextResponse.json(
      typeof errorBody === 'string' ? { message: errorBody } : errorBody ?? { message: 'Failed to load ticket counts' },
      { status: countsResponse.status }
    );
  }

  if (!averageResponse.ok) {
    const errorBody = await readBackendResponseBody<Record<string, unknown>>(averageResponse);
    return NextResponse.json(
      typeof errorBody === 'string' ? { message: errorBody } : errorBody ?? { message: 'Failed to load average response time' },
      { status: averageResponse.status }
    );
  }

  if (!slaResponse.ok) {
    const errorBody = await readBackendResponseBody<Record<string, unknown>>(slaResponse);
    return NextResponse.json(
      typeof errorBody === 'string' ? { message: errorBody } : errorBody ?? { message: 'Failed to load SLA breaches' },
      { status: slaResponse.status }
    );
  }

  const counts = await readBackendResponseBody<TicketCounts>(countsResponse);
  const average = await readBackendResponseBody<AverageResponseTime>(averageResponse);
  const slaBreaches = await readBackendResponseBody<SlaBreaches>(slaResponse);

  return NextResponse.json({
    counts: typeof counts === 'string' || !counts ? { total: 0, open: 0, closed: 0 } : counts,
    averageResponseTime: typeof average === 'string' || !average ? { averageMinutes: null, sampleSize: 0 } : average,
    slaBreaches: typeof slaBreaches === 'string' || !slaBreaches ? { breaches: 0, evaluatedTickets: 0, responseTimeMinutes: null } : slaBreaches
  });
}
