"use client";

import { useState } from 'react';
import { SmtpService } from '@/services/api/smtp.service';
import { X, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SendTestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: {
    id: string;
    name: string;
    from_email: string;
    host: string;
  } | null;
  onSuccess?: () => void;
}

export function SendTestEmailModal({
  isOpen,
  onClose,
  account,
  onSuccess,
}: SendTestEmailModalProps) {
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    latency_ms?: number;
    response?: string;
    message_id?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !recipient.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res: any = await SmtpService.sendTestEmail(account.id, recipient);
      if (res.success) {
        setResult(res.data);
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Failed to send test email');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error occurred while sending test email');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRecipient('');
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl max-w-lg w-full overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Send className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Send Test Email
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Testing account: <span className="font-medium text-gray-700 dark:text-gray-300">{account.name}</span> ({account.from_email})
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            A branded test email will be sent directly through <strong className="font-semibold">{account.host}</strong> to verify authentication, sender permissions, and real-time delivery.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipient Email Address
              </label>
              <input
                type="email"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-start text-sm text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <div className="break-all font-mono text-xs">{error}</div>
              </div>
            )}

            {/* Success Message */}
            {result && (
              <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg text-green-800 dark:text-green-300 space-y-2">
                <div className="flex items-center font-medium text-sm">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Test email sent successfully!
                </div>
                <div className="text-xs space-y-1 font-mono text-green-700 dark:text-green-400 pl-7">
                  {result.latency_ms !== undefined && (
                    <div>Latency: <strong>{result.latency_ms} ms</strong></div>
                  )}
                  {result.response && (
                    <div className="break-all">Response: {result.response}</div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {result ? 'Close' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading || !recipient}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
