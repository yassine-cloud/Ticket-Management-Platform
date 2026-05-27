import { backendUrls } from './urls';

export const projectUrls = {
  list: `${backendUrls.rest}/projects`,
  create: `${backendUrls.rest}/projects`,
  getById: (id: string) => `${backendUrls.rest}/projects/${id}`,
  update: (id: string) => `${backendUrls.rest}/projects/${id}`,
  delete: (id: string) => `${backendUrls.rest}/projects/${id}`,
};
