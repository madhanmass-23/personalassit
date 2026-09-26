import { fetchClient } from './client';

export const taskCategoryService = {
  getAll: () => fetchClient('/task-categories'),
  getById: (id: string | number) => fetchClient(`/task-categories/${id}`),
  create: (data: any) => fetchClient('/task-categories', { method: 'POST', body: data }),
  update: (id: string | number, data: any) => fetchClient(`/task-categories/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number) => fetchClient(`/task-categories/${id}`, { method: 'DELETE' }),
};
