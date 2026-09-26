import { fetchClient } from './client';

export const incomeService = {
  getAll: () => fetchClient('/income'),
  getById: (id: string | number) => fetchClient(`/income/${id}`),
  create: (data: any) => fetchClient('/income', { method: 'POST', body: data }),
  update: (id: string | number, data: any) => fetchClient(`/income/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number) => fetchClient(`/income/${id}`, { method: 'DELETE' }),
};
