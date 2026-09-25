import { fetchClient } from './client';

export const authService = {
  register: (data: Record<string, string>) => fetchClient('/auth/register', { method: 'POST', body: data }),
  login: (data: Record<string, string>) => fetchClient('/auth/login', { method: 'POST', body: data }),
  logout: () => fetchClient('/auth/logout', { method: 'POST' }),
  me: () => fetchClient('/auth/me', { method: 'GET' }),
};
