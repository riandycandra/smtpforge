"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/api/auth.service';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      setLoading(false);
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from your current password');
      setLoading(false);
      return;
    }

    try {
      const res: any = await AuthService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.success) {
        // Update token with the fresh one returned from the API
        const newToken = res.data.token;
        localStorage.setItem('admin_token', newToken);
        document.cookie = `admin_token=${newToken}; path=/; max-age=86400; SameSite=Lax`;

        router.push('/dashboard');
      } else {
        setError(res.message || 'Failed to change password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 font-sans">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Change Your Password</h1>
          <p className="text-gray-500 text-sm">You are using the default password. Please set a new password before continuing.</p>
        </div>

        <div className="my-6 p-3 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-200">
          <strong>Security Notice:</strong> For your safety, the default password must be changed before you can access the dashboard.
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              autoFocus
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Set New Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
