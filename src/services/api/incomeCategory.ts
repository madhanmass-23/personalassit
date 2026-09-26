import { fetchClient } from './client';

export const incomeCategoryService = {
  getAll: () => fetchClient('/income-categories'),
  getById: (id: string | number) => fetchClient(`/income-categories/${id}`),
  create: (data: any) => fetchClient('/income-categories', { method: 'POST', body: data }),
  update: (id: string | number, data: any) => fetchClient(`/income-categories/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number) => fetchClient(`/income-categories/${id}`, { method: 'DELETE' }),
};
