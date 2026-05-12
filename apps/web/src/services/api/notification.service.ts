import { apiClient } from './client';

export interface NotificationConfig {
  id: string;
  name: string;
  type: string;
  config: {
    webhookUrl?: string;
    botToken?: string;
    chatId?: string;
    [key: string]: string | number | boolean | undefined | null | Record<string, unknown>;
  };
  is_enabled: boolean;
  last_status: string;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export const NotificationService = {
  getAll: async (): Promise<NotificationConfig[]> => {
    const response = await apiClient.get<NotificationConfig[]>('/admin/notifications');
    return (response as unknown) as NotificationConfig[];
  },

  create: async (data: Partial<NotificationConfig>): Promise<NotificationConfig> => {
    const response = await apiClient.post<NotificationConfig>('/admin/notifications', data);
    return (response as unknown) as NotificationConfig;
  },

  update: async (id: string, data: Partial<NotificationConfig>): Promise<NotificationConfig> => {
    const response = await apiClient.patch<NotificationConfig>(`/admin/notifications/${id}`, data);
    return (response as unknown) as NotificationConfig;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/notifications/${id}`);
  },

  test: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/admin/notifications/${id}/test`);
    return (response as unknown) as { message: string };
  }
};
