import { apiClient } from './client';

export const SmtpService = {
  getAccounts: async (page = 1, limit = 20) => {
    return apiClient.get(`/admin/smtp?page=${page}&limit=${limit}`);
  },
  
  getAccount: async (id: string) => {
    return apiClient.get(`/admin/smtp/${id}`);
  },

  createAccount: async (data: any) => {
    return apiClient.post('/admin/smtp', data);
  },

  updateAccount: async (id: string, data: any) => {
    return apiClient.put(`/admin/smtp/${id}`, data);
  },

  deleteAccount: async (id: string) => {
    return apiClient.delete(`/admin/smtp/${id}`);
  },

  testConnection: async (id: string) => {
    return apiClient.post(`/admin/smtp/${id}/test`);
  }
};
