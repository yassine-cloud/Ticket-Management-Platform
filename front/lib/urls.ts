const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const restBase = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
);

const graphqlBase =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? `${restBase}/graphql`;

const sseBase = process.env.NEXT_PUBLIC_SSE_URL ?? `${restBase}/sse`;

const wsBase =
  process.env.NEXT_PUBLIC_WS_URL ??
  restBase.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');

export const backendUrls = {
  rest: restBase,
  graphql: graphqlBase,
  sse: sseBase,
  ws: wsBase,
  auth: {
    login: `${restBase}/auth/login`,
    refresh: `${restBase}/auth/refresh`,
    logout: `${restBase}/auth/logout`,
    register: `${restBase}/auth/register`,
    permissionsCheck: `${restBase}/auth/permissions-check`
  },
  projects: {
    list: `${restBase}/projects`,
    create: `${restBase}/projects`,
    getById: (id: string) => `${restBase}/projects/${id}`,
    update: (id: string) => `${restBase}/projects/${id}`,
    delete: (id: string) => `${restBase}/projects/${id}`,
  },
  tickets: {
    list: `${restBase}/tickets`,
    create: `${restBase}/tickets`,
    statuses: `${restBase}/tickets/statuses`,
    getById: (id: string) => `${restBase}/tickets/${id}`,
    update: (id: string) => `${restBase}/tickets/${id}`,
    delete: (id: string) => `${restBase}/tickets/${id}`,
  }
};
