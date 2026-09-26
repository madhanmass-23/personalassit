import { fetchClient } from './client';

export const reportService = {
  getToday: () => fetchClient('/reports/today'),
  getWeek: () => fetchClient('/reports/week'),
  getMonth: () => fetchClient('/reports/month'),
};
