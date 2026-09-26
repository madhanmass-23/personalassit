import { fetchClient } from './client';

export const taskService = {
  getAll: () => fetchClient('/tasks'),
  getById: (id: string | number) => fetchClient(`/tasks/${id}`),
  create: (data: any) => fetchClient('/tasks', { method: 'POST', body: data }),
  update: (id: string | number, data: any) => fetchClient(`/tasks/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number) => fetchClient(`/tasks/${id}`, { method: 'DELETE' }),
};
