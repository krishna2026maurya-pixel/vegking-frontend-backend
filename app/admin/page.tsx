"use client";

import React, { useEffect, useState } from 'react';
import { Users, ShoppingCart, DollarSign, Package, Download, RefreshCw, Store, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Metrics {
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  formattedRevenue: string;
  trends: {
    vendors: string;
    products: string;
    orders: string;
    revenue: string;
  };
}

interface ActivityItem {
  id: string;
  type: 'order' | 'vendor';
  title: string;
  description: string;
  status: string;
  timestamp: string;
  amount: number | null;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setMetrics(json.data.metrics);
        setActivities(json.data.recentActivity || []);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const downloadReport = () => {
    if (!metrics) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Metric,Value,Summary",
         `Total Vendors,${metrics.totalVendors},${metrics.trends.vendors}`,
         `Total Products,${metrics.totalProducts},${metrics.trends.products}`,
         `Total Orders,${metrics.totalOrders},${metrics.trends.orders}`,
         `Total Revenue,${metrics.formattedRevenue},${metrics.trends.revenue}`
        ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vegking_admin_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Real-time live database statistics and store events</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-green-500' : ''} />
          </button>
          <button 
            onClick={downloadReport}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-1.5 text-sm font-semibold shadow-sm"
          >
            <Download size={16} />
            Download Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Vendors" 
          value={loading ? '...' : (metrics?.totalVendors ?? 0).toLocaleString('en-IN')} 
          icon={<Users className="text-blue-500" size={24} />} 
          trend={loading ? 'Loading...' : (metrics?.trends.vendors || 'From database')} 
        />
        <StatCard 
          title="Total Products" 
          value={loading ? '...' : (metrics?.totalProducts ?? 0).toLocaleString('en-IN')} 
          icon={<Package className="text-purple-500" size={24} />} 
          trend={loading ? 'Loading...' : (metrics?.trends.products || 'Active produce')} 
        />
        <StatCard 
          title="Total Orders" 
          value={loading ? '...' : (metrics?.totalOrders ?? 0).toLocaleString('en-IN')} 
          icon={<ShoppingCart className="text-green-500" size={24} />} 
          trend={loading ? 'Loading...' : (metrics?.trends.orders || 'All-time orders')} 
        />
        <StatCard 
          title="Total Revenue" 
          value={loading ? '...' : (metrics?.formattedRevenue ?? '₹0')} 
          icon={<DollarSign className="text-orange-500" size={24} />} 
          trend={loading ? 'Loading...' : (metrics?.trends.revenue || 'Lifetime sales')} 
        />
      </div>

      {/* Live Recent Activity Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          <span className="text-xs text-gray-400 font-medium">Live from DB</span>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            <div className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse" />
            <div className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse" />
            <div className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
            <p>No recent activity in the database.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {activities.map((item) => {
              const isOrder = item.type === 'order';
              return (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isOrder 
                        ? 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400' 
                        : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                    }`}>
                      {isOrder ? <ShoppingCart size={18} /> : <Store size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      item.status === 'Delivered' || item.status === 'Verified'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                        : item.status === 'Cancelled'
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-[11px] text-gray-400 shrink-0 font-medium">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">{value}</h3>
        </div>
        <div className="p-2.5 bg-gray-50 dark:bg-gray-700/60 rounded-xl">
          {icon}
        </div>
      </div>
      <div className="mt-4 text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
        {trend}
      </div>
    </div>
  );
}
