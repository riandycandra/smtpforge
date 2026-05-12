import { apiClient } from './client';

type SmtpAccountPayload = Record<string, unknown>;
type SmtpDraftConnectionPayload = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  ignore_tls_errors?: boolean;
};

export const SmtpService = {
  getAccounts: async (page = 1, limit = 20) => {
    return apiClient.get(`/admin/smtp?page=${page}&limit=${limit}`);
  },
  
  getAccount: async (id: string) => {
    return apiClient.get(`/admin/smtp/${id}`);
  },

  createAccount: async (data: SmtpAccountPayload): Promise<unknown> => {
    return apiClient.post('/admin/smtp', data);
  },

  updateAccount: async (id: string, data: SmtpAccountPayload): Promise<unknown> => {
    return apiClient.put(`/admin/smtp/${id}`, data);
  },

  deleteAccount: async (id: string) => {
    return apiClient.delete(`/admin/smtp/${id}`);
  },

  testConnection: async (id: string) => {
    return apiClient.post(`/admin/smtp/${id}/test`);
  },

  testDraftConnection: async (data: SmtpDraftConnectionPayload): Promise<unknown> => {
    return apiClient.post('/admin/smtp/test', data);
  }
};
