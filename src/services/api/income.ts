import { fetchClient } from './client';

export interface IncomeItem {
  id: number;
  user_id?: number;
  category_id?: number | null;
  amount: number | string;
  source: string;
  title?: string;
  description?: string;
  income_date: string;
  notes?: string | null;
  category?: string;
  category_name?: string | null;
  category_icon?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateIncomeDTO {
  amount: number;
  source: string;
  income_date: string;
  category_id?: number | null;
  notes?: string | null;
}

export type UpdateIncomeDTO = Partial<CreateIncomeDTO>;

export const incomeService = {
  getAll: (): Promise<IncomeItem[]> => fetchClient('/income'),
  getById: (id: string | number): Promise<IncomeItem> => fetchClient(`/income/${id}`),
  create: (data: CreateIncomeDTO): Promise<IncomeItem> =>
    fetchClient('/income', { method: 'POST', body: data }),
  update: (id: string | number, data: UpdateIncomeDTO): Promise<IncomeItem> =>
    fetchClient(`/income/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number): Promise<{ success: boolean }> =>
    fetchClient(`/income/${id}`, { method: 'DELETE' }),
};
