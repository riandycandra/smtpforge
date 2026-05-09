"use client";

import { useEffect, useState } from 'react';
import { MetricsService } from '@/services/api/metrics.service';
import { Activity, Server, Clock, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

export default function MetricsDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      const res: any = await MetricsService.getPlatformMetrics();
      if (res.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load platform metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Platform Metrics</h1>
        <button 
          onClick={() => { setLoading(true); loadMetrics(); }}
          className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && !metrics ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p>Loading operational metrics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600 mr-4">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Queue Depth</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">{metrics?.queueDepth || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start">
              <div className="p-3 rounded-lg bg-green-50 text-green-600 mr-4">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sent</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">{metrics?.totalSent?.toLocaleString() || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start">
              <div className="p-3 rounded-lg bg-red-50 text-red-600 mr-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Failed</p>
                <h3 className="mt-1 text-3xl font-bold text-red-600">{metrics?.totalFailed?.toLocaleString() || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start">
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600 mr-4">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Latency</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">{metrics?.avgLatency || '0ms'}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Observability</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  The metrics shown above represent all-time platform statistics aggregated from the 
                  PostgreSQL job store and real-time Redis queue states.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  For deeper insights, our platform exports native Prometheus metrics on the <code>/metrics</code> 
                  endpoint of both the API and Worker instances.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase">External Integration</h4>
                <p className="text-xs text-gray-500 mb-4">Connect your monitoring stack for timeseries visualization:</p>
                <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
                  <li>Prometheus Scraper Config</li>
                  <li>Grafana Dashboard Templates</li>
                  <li>Alertmanager Notification Hooks</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
