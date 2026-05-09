import { apiClient } from './client';

export const MetricsService = {
  async getDashboardMetrics() {
    return apiClient.get('/admin/metrics/dashboard');
  },
  
  async getPlatformMetrics() {
    return apiClient.get('/admin/metrics/platform');
  },

  async getWorkerStats() {
    return apiClient.get('/admin/metrics/workers');
  },
};
