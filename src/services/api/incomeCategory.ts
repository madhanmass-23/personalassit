import { fetchClient } from './client';

export interface IncomeCategoryItem {
  id: number;
  user_id?: number;
  name: string;
  icon?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateIncomeCategoryDTO {
  name: string;
  icon?: string | null;
}

export type UpdateIncomeCategoryDTO = Partial<CreateIncomeCategoryDTO>;

export const incomeCategoryService = {
  getAll: (): Promise<IncomeCategoryItem[]> => fetchClient('/income-categories'),
  getById: (id: string | number): Promise<IncomeCategoryItem> => fetchClient(`/income-categories/${id}`),
  create: (data: CreateIncomeCategoryDTO): Promise<IncomeCategoryItem> =>
    fetchClient('/income-categories', { method: 'POST', body: data }),
  update: (id: string | number, data: UpdateIncomeCategoryDTO): Promise<IncomeCategoryItem> =>
    fetchClient(`/income-categories/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number): Promise<{ success: boolean }> =>
    fetchClient(`/income-categories/${id}`, { method: 'DELETE' }),
};
