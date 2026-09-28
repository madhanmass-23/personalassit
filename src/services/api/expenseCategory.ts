import { fetchClient } from './client';

export interface ExpenseCategoryItem {
  id: number;
  user_id?: number;
  name: string;
  icon?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExpenseCategoryDTO {
  name: string;
  icon?: string | null;
}

export type UpdateExpenseCategoryDTO = Partial<CreateExpenseCategoryDTO>;

export const expenseCategoryService = {
  getAll: (): Promise<ExpenseCategoryItem[]> => fetchClient('/expense-categories'),
  getById: (id: string | number): Promise<ExpenseCategoryItem> => fetchClient(`/expense-categories/${id}`),
  create: (data: CreateExpenseCategoryDTO): Promise<ExpenseCategoryItem> =>
    fetchClient('/expense-categories', { method: 'POST', body: data }),
  update: (id: string | number, data: UpdateExpenseCategoryDTO): Promise<ExpenseCategoryItem> =>
    fetchClient(`/expense-categories/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number): Promise<{ success: boolean }> =>
    fetchClient(`/expense-categories/${id}`, { method: 'DELETE' }),
};
