"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SmtpService } from '@/services/api/smtp.service';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  host: z.string().min(1, 'Host is required').max(255),
  port: z.coerce.number().min(1).max(65535),
  secure: z.boolean().default(false),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  from_email: z.string().email('Invalid email address'),
  from_name: z.string().optional(),
  retry_attempts: z.coerce.number().min(0).max(10).default(3),
  rate_limit_per_hour: z.coerce.number().min(1).optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  ignore_tls_errors: z.boolean().default(false),
});

export default function NewSmtpPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      port: 587,
      secure: false,
      retry_attempts: 3,
      is_active: true,
      ignore_tls_errors: false,
    }
  });

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        rate_limit_per_hour: data.rate_limit_per_hour || null,
        from_name: data.from_name || null,
      };
      
      const res: any = await SmtpService.createAccount(payload);
      if (res.success) {
        router.push('/dashboard/smtp');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create SMTP account');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 mb-12">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/smtp" className="mr-4 p-2 rounded-full hover:bg-gray-200 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Add SMTP Account</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g. Transactional Primary"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message?.toString()}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
              <input
                {...register('host')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="smtp.example.com"
              />
              {errors.host && <p className="mt-1 text-sm text-red-600">{errors.host.message?.toString()}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
              <input
                type="number"
                {...register('port')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.port && <p className="mt-1 text-sm text-red-600">{errors.port.message?.toString()}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                {...register('username')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message?.toString()}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message?.toString()}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
              <input
                {...register('from_email')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="noreply@example.com"
              />
              {errors.from_email && <p className="mt-1 text-sm text-red-600">{errors.from_email.message?.toString()}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Name (Optional)</label>
              <input
                {...register('from_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Example Inc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Retry Attempts</label>
              <input
                type="number"
                {...register('retry_attempts')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit / Hour (Optional)</label>
              <input
                type="number"
                {...register('rate_limit_per_hour')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="flex items-center space-x-6 col-span-2 pt-2 border-t border-gray-100">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('secure')}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Use SSL/TLS (Secure)</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Set Active immediately</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('ignore_tls_errors')}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Allow self-signed certificates (Ignore TLS errors)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end mt-8">
            <Link
              href="/dashboard/smtp"
              className="px-4 py-2 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save SMTP Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
