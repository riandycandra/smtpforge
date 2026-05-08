"use client";

export default function DashboardIndex() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Queue Depth</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Success Rate</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">99.9%</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Failed Jobs</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">0</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Avg Latency</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">120ms</p>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-center">
        <p className="text-gray-500">For detailed statistics, please visit the Metrics page.</p>
      </div>
    </div>
  );
}
