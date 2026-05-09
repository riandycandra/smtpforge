import { apiClient } from './client';

export const AuthService = {
  async login(credentials: { username: string; password: string }) {
    return apiClient.post('/admin/auth/login', credentials);
  },

  async getStatus() {
    return apiClient.get('/admin/auth/status');
  },

  async changePassword(data: { current_password: string; new_password: string }) {
    return apiClient.post('/admin/auth/change-password', data);
  },
  
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('must_change_password');
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  }
};
