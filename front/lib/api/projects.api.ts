import { getAccessToken } from '@/app/api/auth/_utils';
import { backendUrls } from '../urls';
import { NextRequest } from 'next/server';

export interface CreateProjectInput {
  name: string;
  slug: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateProjectInput {
  name?: string;
  slug?: string;
  description?: string;
  isPublic?: boolean;
  isArchived?: boolean;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

async function getAuthToken() {
    if (typeof window === 'undefined') {    
        return null;
    }

    try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        return data.accessToken ?? null;
    } catch {
        return null;
    }
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

export const projectsAPI = {
  async getProjects(): Promise<ApiResponse<Project[]>> {
    try {
      const response = await fetchWithAuth(backendUrls.projects.list);
      
      if (!response.ok) {
        return {
          error: `Failed to fetch projects: ${response.statusText}`,
          status: response.status,
          data: [],
        };
      }

      const data = await response.json();
      return {
        data: data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
        status: 500,
        data: [],
      };
    }
  },

  async getProjectById(id: string): Promise<ApiResponse<Project>> {
    try {
      const response = await fetchWithAuth(backendUrls.projects.getById(id));
      
      if (!response.ok) {
        return {
          error: `Failed to fetch project: ${response.statusText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data: data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch project',
        status: 500,
      };
    }
  },

  async createProject(input: CreateProjectInput): Promise<ApiResponse<Project>> {
    try {
      const response = await fetchWithAuth(backendUrls.projects.create, {
        method: 'POST',
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: errorData.message || `Failed to create project: ${response.statusText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data: data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to create project',
        status: 500,
      };
    }
  },

  async updateProject(id: string, input: UpdateProjectInput): Promise<ApiResponse<Project>> {
    try {
      const response = await fetchWithAuth(backendUrls.projects.update(id), {
        method: 'PATCH',
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: errorData.message || `Failed to update project: ${response.statusText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data: data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to update project',
        status: 500,
      };
    }
  },

  async deleteProject(id: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await fetchWithAuth(backendUrls.projects.delete(id), {
        method: 'DELETE',
      });

      if (!response.ok) {
        return {
          error: `Failed to delete project: ${response.statusText}`,
          status: response.status,
        };
      }

      return {
        data: { success: true },
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to delete project',
        status: 500,
      };
    }
  },
};
