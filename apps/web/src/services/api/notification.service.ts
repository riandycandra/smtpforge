import { apiClient } from './client';

export interface NotificationConfig {
  id: string;
  name: string;
  type: string;
  config: any;
  is_enabled: boolean;
  last_status: string;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export const NotificationService = {
  getAll: async () => {
    return apiClient.get<NotificationConfig[]>('/admin/notifications');
  },

  create: async (data: Partial<NotificationConfig>) => {
    return apiClient.post<NotificationConfig>('/admin/notifications', data);
  },

  update: async (id: string, data: Partial<NotificationConfig>) => {
    return apiClient.patch<NotificationConfig>(`/admin/notifications/${id}`, data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/admin/notifications/${id}`);
  },

  test: async (id: string) => {
    return apiClient.post(`/admin/notifications/${id}/test`);
  }
};
