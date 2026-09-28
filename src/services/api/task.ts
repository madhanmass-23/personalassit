import { fetchClient } from './client';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';

export interface TaskItem {
  id: number;
  user_id?: number;
  category_id?: number | null;
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  due_time?: string | null;
  completed_at?: string | null;
  recurrence_type?: string | null;
  recurrence_rule?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTaskDTO {
  title: string;
  description?: string | null;
  category_id?: number | null;
  priority?: TaskPriority;
  due_date?: string | null;
  due_time?: string | null;
  status?: TaskStatus;
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  completed_at?: string | null;
}

export const taskService = {
  getAll: (): Promise<TaskItem[]> => fetchClient('/tasks'),
  getById: (id: string | number): Promise<TaskItem> => fetchClient(`/tasks/${id}`),
  create: (data: CreateTaskDTO): Promise<TaskItem> => fetchClient('/tasks', { method: 'POST', body: data }),
  update: (id: string | number, data: UpdateTaskDTO): Promise<TaskItem> => fetchClient(`/tasks/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number): Promise<{ success: boolean }> => fetchClient(`/tasks/${id}`, { method: 'DELETE' }),
  complete: (id: string | number): Promise<TaskItem> => fetchClient(`/tasks/${id}/complete`, { method: 'PATCH' }),
  incomplete: (id: string | number): Promise<TaskItem> => fetchClient(`/tasks/${id}/incomplete`, { method: 'PATCH' }),
};
