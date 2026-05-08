import { apiClient } from './client';

export const MetricsService = {
  getMetrics: async () => {
    return apiClient.get('/admin/metrics');
  }
};
