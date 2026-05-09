"use client";

import { useEffect, useState } from 'react';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2, Server, Activity, Zap, RefreshCw } from 'lucide-react';
import { AuthService } from '@/services/api/auth.service';
import { MetricsService } from '@/services/api/metrics.service';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [workerStats, setWorkerStats] = useState<any>(null);
  const [loadingWorkers, setLoadingWorkers] = useState(true);

  const fetchWorkerStats = async () => {
    setLoadingWorkers(true);
    try {
      const res: any = await MetricsService.getWorkerStats();
      if (res.success) {
        setWorkerStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch worker stats', err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  useEffect(() => {
    fetchWorkerStats();
    const interval = setInterval(fetchWorkerStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

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
    <div className="max-w-4xl mx-auto space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your administrative security and preferences.</p>
      </div>

      {/* Worker Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Infrastructure</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Monitor the status of your background email workers. These processes handle the actual delivery of emails.
          </p>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-lg text-purple-600 dark:text-purple-400">
                  <Server size={20} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Worker Status</h3>
              </div>
              <button 
                onClick={fetchWorkerStats}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                disabled={loadingWorkers}
              >
                <RefreshCw size={18} className={`text-gray-400 ${loadingWorkers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Workers</span>
                    <Zap size={16} className="text-amber-500" />
                  </div>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{workerStats?.count ?? 0}</span>
                    <span className="ml-2 text-xs text-gray-400">instances detected</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">System Health</span>
                    <Activity size={16} className={workerStats?.count > 0 ? 'text-green-500' : 'text-red-500'} />
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className={`h-2.5 w-2.5 rounded-full mr-2 ${workerStats?.count > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 capitalize">
                      {workerStats?.count > 0 ? 'Operational' : 'No Workers Detected'}
                    </span>
                  </div>
                </div>
              </div>

              {workerStats?.count === 0 && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs rounded-lg border border-red-100 dark:border-red-900 flex items-start">
                  <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                  Warning: No active workers detected. Emails will remain in queue and won't be delivered until at least one worker is started.
                </div>
              )}
              
              {workerStats?.workers?.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Detected Worker Nodes</h4>
                  <div className="space-y-2">
                    {workerStats.workers.map((w: any, idx: number) => (
                      <div key={w.id || idx} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg text-sm">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                          <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">{w.id}</span>
                        </div>
                        <span className="text-gray-400 text-xs">{w.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Security</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Update your password regularly to keep your SMTP relay secure.
          </p>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg text-blue-600 dark:text-blue-400">
                  <Lock size={20} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Change Password</h3>
              </div>
              <ShieldCheck className="text-gray-300 dark:text-gray-600" size={24} />
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900 flex items-start">
                  <AlertCircle className="mr-3 h-5 w-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 text-sm rounded-lg border border-green-100 dark:border-green-900 flex items-start">
                  <CheckCircle2 className="mr-3 h-5 w-5 flex-shrink-0" />
                  {success}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all text-gray-900 dark:text-gray-100"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all text-gray-900 dark:text-gray-100"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all text-gray-900 dark:text-gray-100"
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
