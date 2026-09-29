import { fetchClient, tokenStorage } from './client';
import { vaultSession } from '@/lib/vault/vaultSession';

export const authService = {
  register: async (data: Record<string, string>) => {
    const res = await fetchClient('/auth/register', { method: 'POST', body: data });
    if (res?.token) {
      tokenStorage.set(res.token);
    }
    return res;
  },
  login: async (data: Record<string, string>) => {
    const res = await fetchClient('/auth/login', { method: 'POST', body: data });
    if (res?.token) {
      tokenStorage.set(res.token);
    }
    return res;
  },
  googleLogin: async (data: Record<string, string>) => {
    const res = await fetchClient('/auth/google-login', { method: 'POST', body: data });
    if (res?.token) {
      tokenStorage.set(res.token);
    }
    return res;
  },
  logout: async () => {
    try {
      await fetchClient('/auth/logout', { method: 'POST', body: {} });
    } finally {
      tokenStorage.clear();
      vaultSession.reset();
    }
  },
  me: () => fetchClient('/auth/me', { method: 'GET' }),
};

