import { fetchClient } from './client';

export interface ExpenseItem {
  id: number;
  user_id?: number;
  category_id?: number | null;
  amount: number | string;
  description: string;
  title?: string;
  expense_date: string;
  notes?: string | null;
  category?: string;
  category_name?: string | null;
  category_icon?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExpenseDTO {
  amount: number;
  description: string;
  expense_date: string;
  category_id?: number | null;
  notes?: string | null;
}

export type UpdateExpenseDTO = Partial<CreateExpenseDTO>;

export const expenseService = {
  getAll: (): Promise<ExpenseItem[]> => fetchClient('/expenses'),
  getById: (id: string | number): Promise<ExpenseItem> => fetchClient(`/expenses/${id}`),
  create: (data: CreateExpenseDTO): Promise<ExpenseItem> =>
    fetchClient('/expenses', { method: 'POST', body: data }),
  update: (id: string | number, data: UpdateExpenseDTO): Promise<ExpenseItem> =>
    fetchClient(`/expenses/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number): Promise<{ success: boolean }> =>
    fetchClient(`/expenses/${id}`, { method: 'DELETE' }),
};
