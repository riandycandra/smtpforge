"use client";

import { useState } from 'react';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthService } from '@/services/api/auth.service';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

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

    try {
      const res: any = await AuthService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.success) {
        setSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Update token in case it was refreshed
        if (res.data.token) {
          localStorage.setItem('admin_token', res.data.token);
          document.cookie = `admin_token=${res.data.token}; path=/; max-age=86400; SameSite=Lax`;
        }
      } else {
        setError(res.message || 'Failed to change password');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect current password or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your administrative security and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          <p className="text-sm text-gray-500 mt-2">
            Update your password regularly to keep your SMTP relay secure.
          </p>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Lock size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">Change Password</h3>
              </div>
              <ShieldCheck className="text-gray-300" size={24} />
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start">
                  <AlertCircle className="mr-3 h-5 w-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 flex items-start">
                  <CheckCircle2 className="mr-3 h-5 w-5 flex-shrink-0" />
                  {success}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? 'Updating Password...' : 'Save Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
