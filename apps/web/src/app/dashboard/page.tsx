"use client";

import { useEffect, useState, useMemo } from 'react';
import { MetricsService } from '@/services/api/metrics.service';
import { Loader2, TrendingUp, Calendar } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from 'recharts';

export default function DashboardIndex() {
  const [metrics, setMetrics] = useState<any>(null);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [precision, setPrecision] = useState<'day' | 'month' | 'year'>('day');
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);

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

  const loadTimeSeries = async (p: 'day' | 'month' | 'year', autoSwitch = false) => {
    setLoadingChart(true);
    try {
      const res: any = await MetricsService.getTimeSeries(p);
      if (res.success) {
        if (autoSwitch && p === 'day' && res.data.length > 31) {
          // Too much data for daily view, switch to monthly
          setPrecision('month');
          const monthRes: any = await MetricsService.getTimeSeries('month');
          if (monthRes.success) {
            setTimeSeries(monthRes.data);
          }
        } else {
          setTimeSeries(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to load time series:', err);
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    loadTimeSeries('day', true);
    
    const interval = setInterval(() => {
      loadMetrics();
      loadTimeSeries(precision);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [precision]);

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    if (precision === 'day') {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } else if (precision === 'month') {
      return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    }
    return date.getFullYear().toString();
  };

  const chartData = useMemo(() => {
    return timeSeries.map(item => ({
      ...item,
      // Ensure numeric values for recharts
      success: Number(item.success),
      failed: Number(item.failed),
      total: Number(item.success) + Number(item.failed)
    }));
  }, [timeSeries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <div className="flex bg-white dark:bg-gray-900 rounded-lg p-1 border border-gray-200 dark:border-gray-800 shadow-sm">
          {(['day', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPrecision(p)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all capitalize ${
                precision === p 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {p}s
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-transform hover:scale-[1.02]">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Queue Depth</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{metrics?.queueDepth || 0}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Active jobs in queue</p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-transform hover:scale-[1.02]">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Success Rate</h3>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{metrics?.successRate || '100%'}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Last 24 hours</p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-transform hover:scale-[1.02]">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Failed Jobs</h3>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{metrics?.failedJobs || 0}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Last 24 hours</p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-transform hover:scale-[1.02]">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Latency</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{metrics?.avgLatency || '0ms'}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Processing time</p>
        </div>
      </div>
      
      {/* Chart Section */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Delivery Performance
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Successfully sent vs failed emails over time</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div>
              <span className="text-gray-600 dark:text-gray-400">Success</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm shadow-red-400/50"></div>
              <span className="text-gray-600 dark:text-gray-400">Failed</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          {loadingChart ? (
            <div className="h-full w-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <Calendar className="w-12 h-12 opacity-20" />
              <p className="text-sm">No delivery data available for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                <XAxis 
                  dataKey="time" 
                  tickFormatter={formatXAxis} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)', radius: 8 }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' 
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#6b7280' }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
                <Bar 
                  dataKey="success" 
                  name="Success" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                  barSize={precision === 'day' ? 30 : 60}
                />
                <Bar 
                  dataKey="failed" 
                  name="Failed" 
                  fill="#f87171" 
                  radius={[4, 4, 0, 0]} 
                  barSize={precision === 'day' ? 30 : 60}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
