import { fetchClient } from './client';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  auth_provider: 'email' | 'google' | string;
  avatar_url?: string | null;
  timezone: string;
  created_at: string;
  last_login_at?: string | null;
}

export interface UpdateProfileDTO {
  name?: string;
  timezone?: string;
}

export interface UserPreferences {
  id?: number;
  user_id?: number;
  currency: string;
  date_format: string;
  week_start_day: number;
  daily_reminder_enabled: boolean | number;
  daily_reminder_time?: string | null;
  theme: 'system' | 'light' | 'dark' | string;
  created_at?: string;
  updated_at?: string;
}

export type UpdatePreferencesDTO = Partial<
  Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export const profileService = {
  getProfile: (): Promise<{ user: UserProfile }> =>
    fetchClient('/profile', { method: 'GET' }),
  updateProfile: (data: UpdateProfileDTO): Promise<{ user: UserProfile }> =>
    fetchClient('/profile', { method: 'PATCH', body: data }),
  getPreferences: (): Promise<UserPreferences> =>
    fetchClient('/preferences', { method: 'GET' }),
  updatePreferences: (data: UpdatePreferencesDTO): Promise<UserPreferences> =>
    fetchClient('/preferences', { method: 'PATCH', body: data }),
};
