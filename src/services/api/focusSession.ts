import { fetchClient } from './client';

export type FocusMode = 'normal' | 'focus' | 'strict';

export interface FocusSessionItem {
  id: number;
  user_id?: number;
  started_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  mode: FocusMode;
  created_at?: string;
}

export interface CreateFocusSessionDTO {
  started_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  mode: FocusMode;
}

export type UpdateFocusSessionDTO = Partial<CreateFocusSessionDTO>;

export const focusSessionService = {
  getAll: (): Promise<FocusSessionItem[]> => fetchClient('/focus-sessions'),
  getById: (id: string | number): Promise<FocusSessionItem> => fetchClient(`/focus-sessions/${id}`),
  create: (data: CreateFocusSessionDTO): Promise<FocusSessionItem> =>
    fetchClient('/focus-sessions', { method: 'POST', body: data }),
  update: (id: string | number, data: UpdateFocusSessionDTO): Promise<FocusSessionItem> =>
    fetchClient(`/focus-sessions/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string | number): Promise<{ success: boolean }> =>
    fetchClient(`/focus-sessions/${id}`, { method: 'DELETE' }),
};
