"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SmtpService } from '@/services/api/smtp.service';
import { Server, Plus, CheckCircle, XCircle, Edit2, Activity, Send, Plug, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SendTestEmailModal } from '@/components/smtp/SendTestEmailModal';

export default function SmtpListPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [selectedAccountForTest, setSelectedAccountForTest] = useState<any | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res: any = await SmtpService.getAccounts();
      if (res.success) {
        setAccounts(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAllHealth = async () => {
    try {
      setCheckingHealth(true);
      const res: any = await SmtpService.checkHealth();
      if (res.success) {
        toast.success(`Health check finished: ${res.data.healthy} healthy, ${res.data.unhealthy} unhealthy`);
        await loadAccounts();
      } else {
        toast.error('Failed to run health check');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error running health check');
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleQuickHandshakeTest = async (account: any) => {
    try {
      setTestingId(account.id);
      const res: any = await SmtpService.testConnection(account.id);
      if (res.success) {
        toast.success(`Connected to ${account.name}! (${res.data.latency_ms}ms)`);
        await loadAccounts();
      } else {
        toast.error(`Connection failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Handshake failed');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">SMTP Accounts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage outgoing mail servers, monitor connection health, and send live test emails.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCheckAllHealth}
            disabled={checkingHealth || loading}
            className="flex items-center px-3.5 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium shadow-xs disabled:opacity-50 transition-colors"
          >
            <Activity className={`w-4 h-4 mr-2 text-blue-600 dark:text-blue-400 ${checkingHealth ? 'animate-spin' : ''}`} />
            {checkingHealth ? 'Checking Health...' : 'Check Health Now'}
          </button>
          <Link 
            href="/dashboard/smtp/new"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading SMTP Accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Host & Port</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Health</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No SMTP accounts configured.</td>
                  </tr>
                )}
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Server className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500 shrink-0" />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{acc.name}</span>
                          {acc.ignore_tls_errors && (
                            <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 rounded">
                              TLS Unverified
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {acc.host}:{acc.port}
                      <span className="text-xs text-gray-400 block">{acc.secure ? 'SSL/TLS' : 'STARTTLS'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div>{acc.from_email}</div>
                      {acc.from_name && <div className="text-xs text-gray-400">{acc.from_name}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {acc.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400">
                          <XCircle className="w-3 h-3 mr-1" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {acc.health_status === 'healthy' ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                            <CheckCircle className="w-3 h-3 mr-1" /> Healthy
                            {acc.last_health_latency_ms !== null && acc.last_health_latency_ms !== undefined && (
                              <span className="ml-1 opacity-75 font-mono text-[11px]">({acc.last_health_latency_ms}ms)</span>
                            )}
                          </span>
                          {acc.last_health_check_at && (
                            <span className="text-[11px] text-gray-400 block mt-0.5 flex items-center">
                              <Clock className="w-3 h-3 mr-0.5" />
                              {new Date(acc.last_health_check_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      ) : acc.health_status === 'unhealthy' ? (
                        <div>
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 cursor-help"
                            title={acc.last_health_error || 'Health check failed'}
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" /> Unhealthy
                          </span>
                          {acc.last_health_error && (
                            <span className="text-[11px] text-rose-500 truncate block max-w-xs mt-0.5" title={acc.last_health_error}>
                              {acc.last_health_error}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          Untested
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Send Test Email Action */}
                        <button
                          onClick={() => setSelectedAccountForTest(acc)}
                          className="inline-flex items-center p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-md transition-colors"
                          title="Send Live Test Email"
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        {/* Handshake Test Action */}
                        <button
                          onClick={() => handleQuickHandshakeTest(acc)}
                          disabled={testingId === acc.id}
                          className="inline-flex items-center p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
                          title="Test SMTP Handshake"
                        >
                          <Plug className={`w-4 h-4 ${testingId === acc.id ? 'animate-pulse text-blue-500' : ''}`} />
                        </button>

                        {/* Edit Action */}
                        <Link
                          href={`/dashboard/smtp/${acc.id}`}
                          className="inline-flex items-center p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                          title="Edit SMTP Account"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Test Email Modal Dialog */}
      <SendTestEmailModal
        isOpen={Boolean(selectedAccountForTest)}
        onClose={() => setSelectedAccountForTest(null)}
        account={selectedAccountForTest}
        onSuccess={() => {
          loadAccounts();
        }}
      />
    </div>
  );
}

