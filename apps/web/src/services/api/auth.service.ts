import { apiClient } from './client';

export const AuthService = {
  async login(credentials: any) {
    return apiClient.post('/admin/auth/login', credentials);
  },
  
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  }
};
