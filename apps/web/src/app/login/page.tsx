"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/api/auth.service';
import { useTheme } from '../theme-provider';
import { Sun, Moon, ExternalLink } from 'lucide-react';

type AuthStatusResponse = {
  success: boolean;
  data: {
    isDefaultState: boolean;
  };
};

type LoginResponse = {
  success: boolean;
  data: {
    token: string;
    must_change_password: boolean;
  };
  message?: string;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return 'Invalid credentials';
};

const getDocsUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl || apiUrl === '/api/v1') {
    return '/docs';
  }

  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    return new URL('/docs', apiUrl).toString();
  }

  return apiUrl.replace(/\/api\/v1\/?$/, '/docs');
};

const docsUrl = getDocsUrl();

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDefaultState, setIsDefaultState] = useState(false);

  useEffect(() => {
    // Check if we should show the default credentials hint
    const checkStatus = async () => {
      try {
        const res = await AuthService.getStatus() as unknown as AuthStatusResponse;
        if (res.success) {
          setIsDefaultState(res.data.isDefaultState);
        }
      } catch {
        // Silently ignore status check errors
      }
    };
    checkStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!username || !password) {
      setError('Username and password are required');
      setLoading(false);
      return;
    }

    try {
      const res = await AuthService.login({ username, password }) as unknown as LoginResponse;
      if (res.success) {
        const token = res.data.token;
        // Store in localStorage for apiClient
        localStorage.setItem('admin_token', token);
        // Store in cookie for Next.js Middleware
        document.cookie = `admin_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        
        // Check if user must change their password
        if (res.data.must_change_password) {
          router.push('/change-password');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950 font-sans relative">
      {/* Theme toggle in corner */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 shadow-sm"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <Moon className="w-[18px] h-[18px] text-gray-600" />
        ) : (
          <Sun className="w-[18px] h-[18px] text-amber-400" />
        )}
      </button>

      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">SMTP Forge</h1>
          <p className="text-gray-500 dark:text-gray-400">Sign in to manage your email service</p>
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View public API docs
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Username</label>
            <input
              type="text"
              autoFocus
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all text-gray-900 dark:text-gray-100"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all text-gray-900 dark:text-gray-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md shadow-blue-200 dark:shadow-blue-900/30 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        
        {isDefaultState && (
          <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
            Default credentials: admin / admin
          </div>
        )}
      </div>
    </div>
  );
}
