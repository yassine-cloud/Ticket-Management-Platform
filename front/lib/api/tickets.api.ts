import { backendUrls } from '../urls';
import { fetchWithAuth } from './projects.api';

export interface Status {
  id: string;
  name: string;
  color?: string;
}

export interface Ticket {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  statusId: string;
  reporterId: string;
  assigneeId?: string;
  parentId?: string;
  estimateMinutes?: number;
  storyPoints?: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  status?: { name: string; id: string };
  assignee?: { id: string; name: string };
}

export interface CreateTicketInput {
  projectId: string;
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  statusId: string;
  reporterId: string;
  assigneeId?: string;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  statusId?: string;
  assigneeId?: string;
}

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status?: number;
  total?: number;
  page?: number;
  limit?: number;
};

export const ticketsAPI = {
  async getTickets(projectId?: string, page: number = 1, limit: number = 50, search?: string, statusId?: string, priority?: string): Promise<ApiResponse<Ticket[]>> {
    try {
      const url = new URL(backendUrls.tickets.list);
      if (projectId) url.searchParams.append('projectId', projectId);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());
      if (search) url.searchParams.append('search', search);
      if (statusId) url.searchParams.append('statusId', statusId);
      if (priority) url.searchParams.append('priority', priority);

      const response = await fetchWithAuth(url.toString());
      if (!response.ok) {
        return { error: `Failed to fetch tickets: ${response.statusText}`, status: response.status, data: [] };
      }
      const json = await response.json();
      // Backend returns { data, total, page, limit }
      return { 
        data: json.data || json, // fallback if backend hasn't restarted yet
        total: json.total || 0,
        page: json.page || page,
        limit: json.limit || limit,
        status: response.status 
      };
    } catch (e: any) {
      return { error: e.message || 'An error occurred', data: [] };
    }
  },

  async getStatuses(projectId?: string): Promise<ApiResponse<Status[]>> {
    try {
      const query = projectId ? `?projectId=${projectId}` : '';
      const response = await fetchWithAuth(`${backendUrls.tickets.statuses}${query}`);
      if (!response.ok) {
        return { error: `Failed to fetch statuses: ${response.statusText}`, status: response.status, data: [] };
      }
      const data = await response.json();
      return { data, status: response.status };
    } catch (e: any) {
      return { error: e.message || 'An error occurred', data: [] };
    }
  },

  async createTicket(input: CreateTicketInput): Promise<ApiResponse<Ticket>> {
    try {
      const response = await fetchWithAuth(backendUrls.tickets.create, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        return { error: `Failed to create ticket: ${response.statusText}`, status: response.status };
      }
      const data = await response.json();
      return { data, status: response.status };
    } catch (e: any) {
      return { error: e.message || 'An error occurred' };
    }
  },

  async updateTicket(id: string, input: UpdateTicketInput): Promise<ApiResponse<Ticket>> {
    try {
      const response = await fetchWithAuth(backendUrls.tickets.update(id), {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        return { error: `Failed to update ticket: ${response.statusText}`, status: response.status };
      }
      const data = await response.json();
      return { data, status: response.status };
    } catch (e: any) {
      return { error: e.message || 'An error occurred' };
    }
  },

  async listenToTicketEvents(
    onMessage: (ev: { type: string; data: any }) => void,
    onError?: (err: any) => void
  ) {
    if (typeof window === 'undefined') return () => {};

    try {
      const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' });
      const session = await sessionRes.json().catch(() => ({}));
      const token = session.accessToken || (typeof window !== 'undefined' ? window.localStorage.getItem('ticketPlatform.accessToken') : null);

      const { fetchEventSource } = await import('@microsoft/fetch-event-source');
      
      const abortController = new AbortController();

      fetchEventSource(`${backendUrls.tickets.list}/sse/events`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: abortController.signal,
        onmessage(ev) {
          try {
            const data = JSON.parse(ev.data);
            // The nestjs sse wrapper sends events as { type, data } or similar
            // NestJS @Sse() default format sends `data` field
            onMessage({ type: data.type || ev.event || 'message', data: data.data || data });
          } catch (e) {
            onMessage({ type: ev.event || 'message', data: ev.data });
          }
        },
        onerror(err) {
          if (err instanceof Error && err.name === 'AbortError') return;
          if (err && (err as any).name === 'AbortError') return;
          onError?.(err);
        },
        async onopen(res) {
          if (res.ok && res.status === 200) {
            console.log("SSE Connection opened");
          } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            console.log("SSE Connection client error", res.status);
            throw new Error('Client error'); // Stop retrying on client errors
          }
        }
      });

      return () => abortController.abort();
    } catch (e) {
      onError?.(e);
      return () => {};
    }
  }
};
