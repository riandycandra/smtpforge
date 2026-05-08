import { apiClient } from './client';

export const LogsService = {
  getLogs: async (params: Record<string, any>) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiClient.get(`/admin/logs?${query}`);
  },

  resendLog: async (id: string) => {
    return apiClient.post(`/admin/logs/${id}/resend`);
  }
};
