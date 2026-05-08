"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ApiKeyService } from '@/services/api/api-key.service';
import { SmtpService } from '@/services/api/smtp.service';
import { ArrowLeft, Trash2, Shield, Plus, X } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  rate_limit_per_hour: z.coerce.number().min(1).optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

export default function EditApiKeyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [permissions, setPermissions] = useState<any[]>([]);
  const [allSmtp, setAllSmtp] = useState<any[]>([]);
  const [selectedSmtp, setSelectedSmtp] = useState('');
  const [assigning, setAssigning] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      rate_limit_per_hour: '',
      is_active: true,
    }
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [keyRes, permRes, smtpRes]: any = await Promise.all([
          ApiKeyService.getKey(id),
          ApiKeyService.getPermissions(id),
          SmtpService.getAccounts(1, 100)
        ]);

        if (keyRes.success) {
          const data = keyRes.data;
          reset({
            name: data.name,
            rate_limit_per_hour: data.rate_limit_per_hour || '',
            is_active: data.is_active,
          });
        }

        if (permRes.success) {
          setPermissions(permRes.data);
        }

        if (smtpRes.success) {
          setAllSmtp(smtpRes.data.data || []);
        }
      } catch (err: any) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, reset]);

  const onSubmit = async (data: any) => {
    try {
      setError('');
      setSuccess('');
      const payload = {
        name: data.name,
        rate_limit_per_hour: data.rate_limit_per_hour || null,
        is_active: data.is_active,
      };

      const res: any = await ApiKeyService.updateKey(id, payload);
      if (res.success) {
        setSuccess('API Key updated successfully.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update API Key');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this API Key?')) return;

    try {
      setDeleting(true);
      const res: any = await ApiKeyService.deleteKey(id);
      if (res.success) {
        router.push('/dashboard/api-keys');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete API Key');
      setDeleting(false);
    }
  };

  const handleAssignPermission = async () => {
    if (!selectedSmtp) return;

    try {
      setAssigning(true);
      setError('');
      setSuccess('');
      const res: any = await ApiKeyService.assignPermission(id, selectedSmtp);
      if (res.success) {
        setSuccess('SMTP permission assigned successfully.');
        const permRes: any = await ApiKeyService.getPermissions(id);
        if (permRes.success) setPermissions(permRes.data);
        setSelectedSmtp('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign permission');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemovePermission = async (smtpId: string) => {
    if (!window.confirm('Remove this SMTP permission?')) return;

    try {
      setError('');
      setSuccess('');
      const res: any = await ApiKeyService.removePermission(id, smtpId);
      if (res.success) {
        setPermissions(permissions.filter(p => p.smtp_account_id !== smtpId));
        setSuccess('SMTP permission removed.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove permission');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  // Filter out SMTP accounts already assigned
  const availableSmtp = allSmtp.filter(smtp => !permissions.some(p => p.smtp_account_id === smtp.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6 mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard/api-keys" className="mr-4 p-2 rounded-full hover:bg-gray-200 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Manage API Key</h1>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 text-sm font-medium disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Key
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded border border-green-200 text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* API Key Settings */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Settings</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                <input
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message?.toString()}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit per Hour</label>
                <input
                  type="number"
                  {...register('rate_limit_per_hour')}
                  placeholder="Unlimited"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.rate_limit_per_hour && <p className="mt-1 text-sm text-red-600">{errors.rate_limit_per_hour.message?.toString()}</p>}
              </div>

              <div className="pt-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('is_active')}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Permissions */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">SMTP Account Permissions</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              API Keys can only send emails through SMTP accounts they have been granted access to.
            </p>

            <div className="flex space-x-2 mb-6">
              <select
                value={selectedSmtp}
                onChange={(e) => setSelectedSmtp(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select an SMTP Account to grant access...</option>
                {availableSmtp.map(smtp => (
                  <option key={smtp.id} value={smtp.id}>{smtp.name} ({smtp.host})</option>
                ))}
              </select>
              <button
                onClick={handleAssignPermission}
                disabled={assigning || !selectedSmtp}
                className="flex items-center px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign
              </button>
            </div>

            <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned At</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permissions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                        No SMTP permissions granted. This key cannot send emails.
                      </td>
                    </tr>
                  ) : (
                    permissions.map((perm) => (
                      <tr key={perm.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {perm.SmtpAccount?.name || 'Unknown Account'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(perm.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemovePermission(perm.smtp_account_id)}
                            className="text-red-600 hover:text-red-900 flex items-center justify-end w-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
