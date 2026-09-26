import { fetchClient } from './client';

export const expenseCategoryService = {
  getAll: () => fetchClient('/expense-categories'),
  getById: (id: string | number) => fetchClient(`/expense-categories/${id}`),
  create: (data: any) => fetchClient('/expense-categories', { method: 'POST', body: data }),
  update: (id: string | number, data: any) => fetchClient(`/expense-categories/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number) => fetchClient(`/expense-categories/${id}`, { method: 'DELETE' }),
};
