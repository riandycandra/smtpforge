"use client";

import { useEffect, useState, useRef } from 'react';
import { LogsService } from '@/services/api/logs.service';
import { Mail, Search, RefreshCw, AlertCircle, CheckCircle, Clock, Loader2, RotateCcw, Eye, X, Server } from 'lucide-react';
import DOMPurify from 'dompurify';

interface EmailLog {
  id: string;
  status: 'sent' | 'failed' | 'queued' | 'processing' | 'retrying';
  to: string[];
  subject: string;
  html: string;
  error_message?: string;
  smtp_response?: string;
  created_at: string;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
  sent: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: CheckCircle, label: 'Sent' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: AlertCircle, label: 'Failed' },
  queued: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', icon: Clock, label: 'Queued' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: Loader2, label: 'Processing' },
  retrying: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', icon: RotateCcw, label: 'Retrying' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_BADGE[status];
  if (!config) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 capitalize">
        {status}
      </span>
    );
  }
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
      <Icon className={`mr-2 w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const d = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const t = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${d}, ${t}`;
};

export default function LogsDashboardPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLogs() {
      setLoading(true);
      try {
        const res = await LogsService.getLogs({
          page,
          limit: 20,
          status: statusFilter,
          subject: search,
        }) as unknown as { success: boolean; data: { data: EmailLog[] } };
        if (!cancelled && res.success) {
          setLogs(res.data?.data || []);
        }
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLogs();
    return () => { cancelled = true; };
  }, [page, statusFilter, search]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await LogsService.getLogs({
        page,
        limit: 20,
        status: statusFilter,
        subject: search,
      }) as unknown as { success: boolean; data: { data: EmailLog[] } };
      if (res.success) {
        setLogs(res.data?.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLog && dialogRef.current) {
      dialogRef.current.showModal();
    } else if (!selectedLog && dialogRef.current) {
      dialogRef.current.close();
    }
  }, [selectedLog]);

  const handleResend = async (id: string) => {
    try {
      await LogsService.resendLog(id);
      alert('Email enqueued for resend!');
      void loadLogs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to resend: ${message}`);
    }
  };



  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Email Logs</h1>

      {/* Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #f3f4f6', gap: '12px' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', width: '300px', overflow: 'hidden' }}>
            <div style={{ padding: '0 0 0 12px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Search style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
            </div>
            <input
              type="text"
              placeholder="Search by subject..."
              style={{ width: '100%', padding: '8px 12px 8px 8px', fontSize: '14px', border: 'none', outline: 'none', backgroundColor: 'transparent' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            style={{ padding: '8px 12px', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', outline: 'none' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="retrying">Retrying</option>
          </select>

          {/* Spacer pushes refresh to the right */}
          <div style={{ flex: 1 }} />

          {/* Refresh */}
          <button
            onClick={() => loadLogs()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '14px', fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
            <p className="text-sm font-medium text-gray-500">Fetching email logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">No logs found matching criteria.</td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Mail className="mr-2 w-4 h-4 text-gray-400 flex-shrink-0" />
                        {log.to.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{log.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResend(log.id)}
                          className="mr-2 inline-flex items-center px-3 py-1.5 border border-blue-100 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50/30 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all active:scale-95 shadow-sm"
                        >
                          <RotateCcw className="w-4 h-4 mr-1 text-blue-500" />
                          Resend
                        </button>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all active:scale-95 shadow-sm"
                        >
                          <Eye className="w-5 h-5 mr-1 text-gray-400" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to <span className="font-medium">{Math.min(page * 20, (page - 1) * 20 + logs.length)}</span> results
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <div className="flex items-center justify-center min-w-[80px] text-sm font-medium text-gray-600">
              Page {page}
            </div>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={logs.length < 20}
              className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modern Native Dialog Modal */}
      <dialog
        id="log-details-dialog"
        ref={dialogRef}
        onClose={() => setSelectedLog(null)}
        className="m-auto rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] p-0 bg-white border-none overflow-hidden outline-none open:flex open:flex-col inset-ring inset-ring-gray-900/5"
      >
        {selectedLog && (
          <>
            {/* Modal Top Bar (Actions) */}
            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleResend(selectedLog.id);
                    setSelectedLog(null);
                  }}
                  className="mr-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 inset-ring inset-ring-white/10"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resend Email
                </button>
                <div className="h-6 w-px bg-gray-200 mx-2" />
                <StatusBadge status={selectedLog.status} />
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Header Area */}
            <div className="px-8 py-6 bg-white border-b border-gray-100 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {selectedLog.subject}
              </h2>

              <div className="flex flex-col space-y-2 text-sm">
                <div className="flex items-start gap-3">
                  <span className="w-12 text-gray-400 font-medium">To:</span>
                  <span className="flex-1 font-medium text-gray-700">
                    {selectedLog.to.join(', ')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-12 text-gray-400 font-medium">Date:</span>
                  <span className="text-gray-500">
                    {formatDate(selectedLog.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex bg-gray-50">
              <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
                {/* Main Content Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 min-h-[500px] flex flex-col inset-ring inset-ring-gray-900/5">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Content Preview</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 mr-2" /> Sandboxed
                    </span>
                  </div>
                  <iframe
                    title="Email Preview"
                    className="w-full flex-1 border-none bg-white p-4"
                    sandbox="allow-popups"
                    srcDoc={DOMPurify.sanitize(selectedLog.html)}
                  />
                </div>

                {/* Secondary Info Grid */}
                {(selectedLog.error_message || selectedLog.smtp_response) && (
                  <div className="grid grid-cols-1 gap-6 pb-12">
                    {selectedLog.error_message && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4 inset-ring inset-ring-red-900/5">
                        <div className="flex items-center gap-2 mb-2 text-red-700 font-bold text-xs uppercase tracking-wider">
                          <AlertCircle className="w-4 h-4" /> Delivery Error
                        </div>
                        <p className="text-sm text-red-800 font-mono bg-white/50 p-3 rounded-lg border border-red-200/50">
                          {selectedLog.error_message}
                        </p>
                      </div>
                    )}

                    {selectedLog.smtp_response && (
                      <div className="bg-gray-800 rounded-xl p-4 shadow-xl inset-ring inset-ring-white/5">
                        <div className="flex items-center gap-2 mb-3 text-gray-400 font-bold text-xs uppercase tracking-wider">
                          <Server className="w-4 h-4" /> SMTP Transcript
                        </div>
                        <pre className="text-[11px] font-mono text-gray-300 overflow-x-auto leading-relaxed custom-scrollbar">
                          {selectedLog.smtp_response}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}

