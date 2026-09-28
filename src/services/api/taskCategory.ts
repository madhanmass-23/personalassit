import { fetchClient } from './client';

export interface TaskCategoryItem {
  id: number;
  user_id?: number;
  name: string;
  color?: string | null;
  icon?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTaskCategoryDTO {
  name: string;
  color?: string | null;
  icon?: string | null;
}

export type UpdateTaskCategoryDTO = Partial<CreateTaskCategoryDTO>;

export const taskCategoryService = {
  getAll: (): Promise<TaskCategoryItem[]> => fetchClient('/task-categories'),
  getById: (id: string | number): Promise<TaskCategoryItem> => fetchClient(`/task-categories/${id}`),
  create: (data: CreateTaskCategoryDTO): Promise<TaskCategoryItem> => fetchClient('/task-categories', { method: 'POST', body: data }),
  update: (id: string | number, data: UpdateTaskCategoryDTO): Promise<TaskCategoryItem> => fetchClient(`/task-categories/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number): Promise<{ success: boolean }> => fetchClient(`/task-categories/${id}`, { method: 'DELETE' }),
};

