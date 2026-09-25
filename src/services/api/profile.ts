import { fetchClient } from './client';

export const profileService = {
  getProfile: () => fetchClient('/profile', { method: 'GET' }),
  updateProfile: (data: Record<string, string>) => fetchClient('/profile', { method: 'PATCH', body: data }),
};
