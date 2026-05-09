"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SmtpService } from '@/services/api/smtp.service';
import { ArrowLeft, Trash2, Plug } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  host: z.string().min(1, 'Host is required').max(255),
  port: z.coerce.number().min(1).max(65535),
  secure: z.boolean().default(false),
  username: z.string().min(1, 'Username is required'),
  password: z.string().optional(), // Optional on update
  from_email: z.string().email('Invalid email address'),
  from_name: z.string().optional(),
  retry_attempts: z.coerce.number().min(0).max(10).default(3),
  rate_limit_per_hour: z.coerce.number().min(1).optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  ignore_tls_errors: z.boolean().default(false),
});

export default function EditSmtpPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
      from_email: '',
      from_name: '',
      retry_attempts: 3,
      rate_limit_per_hour: '',
      is_active: true,
      ignore_tls_errors: false,
    }
  });

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res: any = await SmtpService.getAccount(id);
        if (res.success) {
          const data = res.data;
          reset({
            name: data.name,
            host: data.host,
            port: data.port,
            secure: data.secure,
            username: data.username,
            password: '', // Do not populate password
            from_email: data.from_email,
            from_name: data.from_name || '',
            retry_attempts: data.retry_attempts,
            rate_limit_per_hour: data.rate_limit_per_hour || '',
            is_active: data.is_active,
            ignore_tls_errors: data.ignore_tls_errors || false,
          });
        }
      } catch (err: any) {
        setError('Failed to load SMTP account.');
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [id, reset]);

  const onSubmit = async (data: any) => {
    try {
      setError('');
      setSuccess('');
      const payload = {
        ...data,
        rate_limit_per_hour: data.rate_limit_per_hour || null,
        from_name: data.from_name || null,
      };
      
      // If password is empty, don't send it so it won't be updated
      if (!payload.password) {
        delete payload.password;
      }
      
      const res: any = await SmtpService.updateAccount(id, payload);
      if (res.success) {
        setSuccess('SMTP Account updated successfully.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update SMTP account');
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      setError('');
      setSuccess('');
      const res: any = await SmtpService.testConnection(id);
      if (res.success) {
        setSuccess(`Connection successful! Latency: ${res.data.latency_ms}ms`);
      }
    } catch (err: any) {
      setError(`Connection test failed: ${err.message || 'Unknown error'}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this SMTP account?')) return;
    
    try {
      setDeleting(true);
      const res: any = await SmtpService.deleteAccount(id);
      if (res.success) {
        router.push('/dashboard/smtp');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete SMTP account');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard/smtp" className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Manage SMTP Account</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="flex items-center px-4 py-2 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-950 text-sm font-medium disabled:opacity-50"
          >
            <Plug className="w-4 h-4 mr-2" />
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center px-4 py-2 border border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950 text-sm font-medium disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 rounded border border-red-200 dark:border-red-900 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 rounded border border-green-200 dark:border-green-900 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message?.toString()}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Host</label>
              <input
                {...register('host')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              {errors.host && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.host.message?.toString()}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
              <input
                type="number"
                {...register('port')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              {errors.port && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.port.message?.toString()}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <input
                {...register('username')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              {errors.username && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username.message?.toString()}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password"
                {...register('password')}
                placeholder="Leave blank to keep unchanged"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message?.toString()}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Email</label>
              <input
                {...register('from_email')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              {errors.from_email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.from_email.message?.toString()}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Name (Optional)</label>
              <input
                {...register('from_name')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retry Attempts</label>
              <input
                type="number"
                {...register('retry_attempts')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rate Limit / Hour (Optional)</label>
              <input
                type="number"
                {...register('rate_limit_per_hour')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-center space-x-6 col-span-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('secure')}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Use SSL/TLS (Secure)</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('ignore_tls_errors')}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Allow self-signed certificates (Ignore TLS errors)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end mt-8">
            <Link
              href="/dashboard/smtp"
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 mr-3"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
