import { fetchClient, fetchBlob, BlobResponse } from './client';

export interface FinancialSummaryReport {
  income: number;
  expense: number;
  kept: number;
  focus_seconds?: number;
  pending_tasks?: number;
  completed_tasks?: number;
}

export type ExportReportType = 'expenses' | 'income' | 'monthly';

export const reportService = {
  getToday: (): Promise<FinancialSummaryReport> => fetchClient('/reports/today'),
  getWeek: (): Promise<FinancialSummaryReport> => fetchClient('/reports/week'),
  getMonth: (): Promise<FinancialSummaryReport> => fetchClient('/reports/month'),
  exportCsv: (type: ExportReportType): Promise<BlobResponse> =>
    fetchBlob(`/reports/export/${type}`),
};

export async function downloadReportFile(type: ExportReportType): Promise<string> {
  const result = await reportService.exportCsv(type);
  const fallbackNames: Record<ExportReportType, string> = {
    expenses: 'expenses.csv',
    income: 'income.csv',
    monthly: 'monthly-overview.csv',
  };
  const filename = result.filename || fallbackNames[type];

  const blobUrl = window.URL.createObjectURL(result.blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(blobUrl);
  }, 100);

  return filename;
}
