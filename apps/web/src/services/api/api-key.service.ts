import { apiClient } from './client';

export const ApiKeyService = {
  getKeys: async (page = 1, limit = 20) => {
    return apiClient.get(`/admin/api-keys?page=${page}&limit=${limit}`);
  },
  
  getKey: async (id: string) => {
    return apiClient.get(`/admin/api-keys/${id}`);
  },

  createKey: async (data: any) => {
    return apiClient.post('/admin/api-keys', data);
  },

  updateKey: async (id: string, data: any) => {
    return apiClient.put(`/admin/api-keys/${id}`, data);
  },

  deleteKey: async (id: string) => {
    return apiClient.delete(`/admin/api-keys/${id}`);
  },

  getPermissions: async (id: string) => {
    return apiClient.get(`/admin/api-keys/${id}/smtp-permissions`);
  },

  assignPermission: async (id: string, smtpId: string) => {
    return apiClient.post(`/admin/api-keys/${id}/smtp-permissions`, { smtp_account_id: smtpId });
  },

  removePermission: async (id: string, smtpId: string) => {
    return apiClient.delete(`/admin/api-keys/${id}/smtp-permissions/${smtpId}`);
  }
};
