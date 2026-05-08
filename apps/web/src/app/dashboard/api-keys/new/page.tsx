"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ApiKeyService } from '@/services/api/api-key.service';
import { Check, Copy, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  rate_limit_per_hour: z.coerce.number().min(1).optional().or(z.literal('')),
});

export default function NewApiKeyPage() {
  const router = useRouter();
  const [createdKey, setCreatedKey] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        name: data.name,
        rate_limit_per_hour: data.rate_limit_per_hour || null,
      };
      const res: any = await ApiKeyService.createKey(payload);
      if (res.success) {
        setCreatedKey(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create API key');
    }
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (createdKey) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">API Key Created Successfully</h2>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 my-6 flex items-start text-left">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-yellow-800">Important: Save this key now!</h4>
              <p className="text-sm text-yellow-700 mt-1">
                For security reasons, this API key will <strong>only be shown once</strong>.
                You will not be able to view it again after leaving this page.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded p-4 mb-8">
            <code className="text-gray-900 font-mono text-lg break-all mr-4">{createdKey.api_key}</code>
            <button
              onClick={handleCopy}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-600"
            >
              {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2 text-gray-600" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <Link
            href="/dashboard/api-keys"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full"
          >
            Go back to API Keys
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/api-keys" className="mr-4 p-2 rounded-full hover:bg-gray-200 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Create New API Key</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g. Production Backend"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message?.toString()}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit per Hour (Optional)</label>
            <input
              type="number"
              {...register('rate_limit_per_hour')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Leave empty for unlimited"
            />
            {errors.rate_limit_per_hour && <p className="mt-1 text-sm text-red-600">{errors.rate_limit_per_hour.message?.toString()}</p>}
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <Link
              href="/dashboard/api-keys"
              className="px-4 py-2 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Generating...' : 'Generate API Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
