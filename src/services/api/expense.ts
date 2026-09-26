import { fetchClient } from './client';

export const expenseService = {
  getAll: () => fetchClient('/expenses'),
  getById: (id: string | number) => fetchClient(`/expenses/${id}`),
  create: (data: any) => fetchClient('/expenses', { method: 'POST', body: data }),
  update: (id: string | number, data: any) => fetchClient(`/expenses/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number) => fetchClient(`/expenses/${id}`, { method: 'DELETE' }),
};
