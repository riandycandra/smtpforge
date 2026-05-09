"use client";

import { useEffect, useState } from 'react';
import { MetricsService } from '@/services/api/metrics.service';
import { Loader2 } from 'lucide-react';

export default function DashboardIndex() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      const res: any = await MetricsService.getDashboardMetrics();
      if (res.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Queue Depth</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{metrics?.queueDepth || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Active jobs in queue</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Success Rate</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">{metrics?.successRate || '100%'}</p>
          <p className="text-xs text-gray-400 mt-1">Last 24 hours</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Failed Jobs</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">{metrics?.failedJobs || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Last 24 hours</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Avg Latency</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{metrics?.avgLatency || '0ms'}</p>
          <p className="text-xs text-gray-400 mt-1">Processing time</p>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Welcome to SMTP Forge</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Your centralized email relay service is up and running. Monitor your email delivery performance 
          and manage your SMTP configurations from this dashboard.
        </p>
      </div>
    </div>
  );
}
