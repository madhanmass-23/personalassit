import { fetchClient } from './client';

export const focusSessionService = {
  getAll: () => fetchClient('/focus-sessions'),
  getById: (id: string | number) => fetchClient(`/focus-sessions/${id}`),
  create: (data: any) => fetchClient('/focus-sessions', { method: 'POST', body: data }),
  update: (id: string | number, data: any) => fetchClient(`/focus-sessions/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number) => fetchClient(`/focus-sessions/${id}`, { method: 'DELETE' }),
};
