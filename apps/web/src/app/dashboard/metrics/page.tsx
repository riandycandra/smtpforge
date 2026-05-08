"use client";

import { useEffect, useState } from 'react';
import { MetricsService } from '@/services/api/metrics.service';
import { Activity, Server, Clock, AlertTriangle } from 'lucide-react';

export default function MetricsDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real scenario, this would poll or use the prometheus endpoint parsed 
    // Here we'll simulate the operational view
    setTimeout(() => {
      setMetrics({
        queueDepth: 14,
        totalSent: 12054,
        totalFailed: 23,
        avgLatency: '450ms',
      });
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Platform Metrics</h1>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading operational metrics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-start">
              <div className="p-3 rounded-md bg-blue-50 text-blue-600 mr-4">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Queue Depth</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">{metrics.queueDepth}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-start">
              <div className="p-3 rounded-md bg-green-50 text-green-600 mr-4">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Sent</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">{metrics.totalSent}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-start">
              <div className="p-3 rounded-md bg-red-50 text-red-600 mr-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Failed</p>
                <h3 className="mt-1 text-3xl font-bold text-red-600">{metrics.totalFailed}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-start">
              <div className="p-3 rounded-md bg-purple-50 text-purple-600 mr-4">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Avg Latency</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">{metrics.avgLatency}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Prometheus Integration</h3>
            <p className="text-sm text-gray-600">
              Detailed timeseries metrics are exported via the <code>/metrics</code> endpoint on the API and Worker containers. 
              Please connect your Grafana instance to the Prometheus scraper to visualize real-time histograms and concurrency graphs.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
