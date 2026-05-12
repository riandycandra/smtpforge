"use client";

import { useEffect, useState, useCallback } from 'react';
import { NotificationService, NotificationConfig } from '@/services/api/notification.service';
import { Bell, Plus, CheckCircle, XCircle, Trash2, Edit2, ExternalLink, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

const channelDetails: Record<string, { namePlaceholder: string; webhookPlaceholder: string; helpHref: string; helpLabel: string }> = {
  teams: {
    namePlaceholder: 'e.g. Engineering Team MS Teams',
    webhookPlaceholder: 'https://outlook.office.com/webhook/...',
    helpHref: 'https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook',
    helpLabel: 'How to get a Teams webhook?',
  },
  slack: {
    namePlaceholder: 'e.g. Engineering Slack Alerts',
    webhookPlaceholder: 'https://hooks.slack.com/services/...',
    helpHref: 'https://api.slack.com/messaging/webhooks',
    helpLabel: 'How to get a Slack webhook?',
  },
  telegram: {
    namePlaceholder: 'e.g. Telegram Ops Alerts',
    webhookPlaceholder: '',
    helpHref: 'https://core.telegram.org/bots/features#botfather',
    helpLabel: 'How to create a Telegram bot?',
  },
};

export default function NotificationsPage() {
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<NotificationConfig | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('teams');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  const loadConfigs = useCallback(async () => {
    try {
      const data = await NotificationService.getAll();
      setConfigs(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetch = async () => {
      await loadConfigs();
    };
    fetch();
  }, [loadConfigs]);

  const resetForm = () => {
    setName('');
    setType('teams');
    setWebhookUrl('');
    setBotToken('');
    setChatId('');
    setIsEnabled(true);
    setEditingConfig(null);
  };

  const handleTypeChange = (nextType: string) => {
    setType(nextType);
    setWebhookUrl('');
    setBotToken('');
    setChatId('');
  };

  const handleOpenModal = (config?: NotificationConfig) => {
    if (config) {
      setEditingConfig(config);
      setName(config.name);
      setType(config.type);
      setWebhookUrl(config.config.webhookUrl || '');
      setBotToken(config.config.botToken || '');
      setChatId(config.config.chatId || '');
      setIsEnabled(config.is_enabled);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        type,
        config: type === 'telegram' ? { botToken, chatId } : { webhookUrl },
        is_enabled: isEnabled,
      };

      if (editingConfig) {
        await NotificationService.update(editingConfig.id, payload);
        toast.success('Notification updated');
      } else {
        await NotificationService.create(payload);
        toast.success('Notification created');
      }
      setIsModalOpen(false);
      loadConfigs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save notification');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      await NotificationService.delete(id);
      toast.success('Notification deleted');
      loadConfigs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete notification');
    }
  };

  const selectedChannelDetails = channelDetails[type] || channelDetails.teams;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Worker Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure where to send notifications when workers go up or down.
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Channel
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-blue-600 rounded-full mb-4" role="status" aria-label="loading"></div>
            <p>Loading notification channels...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Channel Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Enabled</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {configs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-lg font-medium">No notification channels yet</p>
                      </div>
                    </td>
                  </tr>
                )}
                {configs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 text-blue-600 dark:text-blue-400">
                          <Bell className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{config.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{config.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {config.last_status === 'up' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" /> Worker Up
                        </span>
                      ) : config.last_status === 'down' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400">
                          <XCircle className="w-3 h-3 mr-1" /> Worker Down
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                          Unknown
                        </span>
                      )}
                      {config.last_checked_at && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          Checked {new Date(config.last_checked_at).toLocaleTimeString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => NotificationService.update(config.id, { is_enabled: !config.is_enabled }).then(loadConfigs)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config.is_enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config.is_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button 
                        onClick={() => {
                          const promise = NotificationService.test(config.id);
                          toast.promise(promise, {
                            loading: 'Sending test notification...',
                            success: 'Test notification sent!',
                            error: 'Failed to send test notification',
                          });
                        }}
                        title="Send Test Notification"
                        className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleOpenModal(config)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(config.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {editingConfig ? 'Edit Channel' : 'Add Notification Channel'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Channel Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={selectedChannelDetails.namePlaceholder}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Channel Type</label>
                <select
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="teams">Microsoft Teams</option>
                  <option value="slack">Slack</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>

              {type === 'telegram' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Bot Token</label>
                    <input
                      type="password"
                      required
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="123456789:ABCDEF..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Chat ID</label>
                    <input
                      type="text"
                      required
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      placeholder="-1001234567890"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                    <p className="mt-2 text-xs text-gray-500 flex items-center">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      <a href={selectedChannelDetails.helpHref} target="_blank" rel="noreferrer" className="underline hover:text-blue-500">{selectedChannelDetails.helpLabel}</a>
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Webhook URL</label>
                  <input
                    type="url"
                    required
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder={selectedChannelDetails.webhookPlaceholder}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    <a href={selectedChannelDetails.helpHref} target="_blank" rel="noreferrer" className="underline hover:text-blue-500">{selectedChannelDetails.helpLabel}</a>
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_enabled"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="is_enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable this channel
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                  {editingConfig ? 'Update' : 'Save Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
