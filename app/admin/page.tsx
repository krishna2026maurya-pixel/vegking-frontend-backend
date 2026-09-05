"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Download,
  RefreshCw,
  Store,
  TrendingUp,
  ArrowUpRight,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Boxes,
  PhoneCall,
  Activity
} from 'lucide-react';

interface Metrics {
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  formattedRevenue: string;
  trends: {
    vendors: string;
    products: string;
    orders: string;
    users: string;
    revenue: string;
  };
}

interface ChartDay {
  date: string;
  label: string;
  dayOfWeek: string;
  orders: number;
  revenue: number;
}

interface ActivityItem {
  id: string;
  type: 'order' | 'product' | 'vendor' | 'user';
  title: string;
  description: string;
  status: string;
  timestamp: string;
  amount?: number | null;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentVendors, setRecentVendors] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'products' | 'vendors' | 'users'>('all');
  const [chartView, setChartView] = useState<'revenue' | 'orders'>('revenue');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setMetrics(json.data.metrics);
        setChartData(json.data.chartData || []);
        setRecentActivity(json.data.recentActivity || []);
        setRecentProducts(json.data.recentProducts || []);
        setRecentOrders(json.data.recentOrders || []);
        setRecentVendors(json.data.recentVendors || []);
        setRecentUsers(json.data.recentUsers || []);
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
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Metric,Value,Summary",
        `Total Revenue,${metrics.formattedRevenue},${metrics.trends.revenue}`,
        `Total Orders,${metrics.totalOrders},${metrics.trends.orders}`,
        `Total Products,${metrics.totalProducts},${metrics.trends.products}`,
        `Total Vendors,${metrics.totalVendors},${metrics.trends.vendors}`,
        `Total Users,${metrics.totalUsers},${metrics.trends.users}`,
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vegking_admin_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Recent';
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

  // Chart computations
  const maxRevenue = Math.max(1, ...chartData.map((d) => d.revenue));
  const maxOrders = Math.max(1, ...chartData.map((d) => d.orders));
  const totalWeekRevenue = chartData.reduce((acc, c) => acc + c.revenue, 0);
  const totalWeekOrders = chartData.reduce((acc, c) => acc + c.orders, 0);

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1600px] mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Admin Command Center
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time analytics, freshly added inventory, users, vendors, and incoming orders.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="p-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
          </button>
          <button
            onClick={downloadReport}
            disabled={loading}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 5-Column Compact Responsive Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
        <CompactStatCard
          title="Revenue"
          value={loading ? '...' : (metrics?.formattedRevenue ?? '₹0')}
          trend={metrics?.trends.revenue || 'Lifetime sales'}
          icon={<DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          accent="emerald"
        />
        <CompactStatCard
          title="Orders"
          value={loading ? '...' : (metrics?.totalOrders ?? 0).toLocaleString('en-IN')}
          trend={metrics?.trends.orders || 'All-time orders'}
          icon={<ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          accent="blue"
        />
        <CompactStatCard
          title="Products"
          value={loading ? '...' : (metrics?.totalProducts ?? 0).toLocaleString('en-IN')}
          trend={metrics?.trends.products || 'Active produce'}
          icon={<Package className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
          accent="violet"
        />
        <CompactStatCard
          title="Vendors"
          value={loading ? '...' : (metrics?.totalVendors ?? 0).toLocaleString('en-IN')}
          trend={metrics?.trends.vendors || 'Registered vendors'}
          icon={<Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          accent="amber"
        />
        <CompactStatCard
          title="Users"
          value={loading ? '...' : (metrics?.totalUsers ?? 0).toLocaleString('en-IN')}
          trend={metrics?.trends.users || 'Registered buyers'}
          icon={<Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
          accent="cyan"
        />
      </div>

      {/* Analytics Graph & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Beautiful 7-Day Curved Spline Wave Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  7-Day Sales & Velocity Curve
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Week Total: <strong className="text-gray-900 dark:text-white">₹{totalWeekRevenue.toLocaleString('en-IN')}</strong> ({totalWeekOrders} orders)
                </p>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Avg: ₹{Math.round(totalWeekRevenue / Math.max(1, chartData.length)).toLocaleString('en-IN')}/day
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setChartView('revenue')}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  chartView === 'revenue'
                    ? 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                }`}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setChartView('orders')}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  chartView === 'orders'
                    ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                }`}
              >
                Orders Volume
              </button>
            </div>
          </div>

          {/* Curved Wave Spline Chart */}
          <div className="pt-3">
            {loading ? (
              <div className="h-44 flex items-center justify-center text-xs text-gray-400 animate-pulse">
                Loading live analytics...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-gray-400">
                No orders recorded in the last 7 days.
              </div>
            ) : (() => {
              const isRev = chartView === 'revenue';
              const maxVal = Math.max(1, isRev ? maxRevenue : maxOrders);

              // SVG layout coordinates
              const svgW = 600;
              const svgH = 155;
              const padLeft = 48;
              const padRight = 16;
              const padTop = 18;
              const baseY = 135;
              const plotW = svgW - padLeft - padRight;
              const plotH = baseY - padTop;

              const points = chartData.map((d, i) => {
                const val = isRev ? d.revenue : d.orders;
                const x = padLeft + (chartData.length > 1 ? (i / (chartData.length - 1)) * plotW : plotW / 2);
                const ratio = Math.min(1, Math.max(0, val / maxVal));
                const y = baseY - ratio * plotH;
                return { x, y, val, d, i };
              });

              // Construct smooth Catmull-Rom/Cubic Bezier curve
              let linePath = '';
              if (points.length > 0) {
                linePath = `M ${points[0].x} ${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                  const p0 = points[i];
                  const p1 = points[i + 1];
                  const dx = (p1.x - p0.x) * 0.45;
                  linePath += ` C ${p0.x + dx} ${p0.y}, ${p1.x - dx} ${p1.y}, ${p1.x} ${p1.y}`;
                }
              }

              const areaPath = points.length > 0
                ? `${linePath} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`
                : '';

              const activePt = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

              return (
                <div className="space-y-2">
                  {/* Floating active point indicator bar */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-[11px] font-bold text-gray-400">
                      {activePt ? `${activePt.d.dayOfWeek}, ${activePt.d.label}` : 'Select a date'}
                    </span>
                    {activePt && (
                      <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                        isRev
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      }`}>
                        {isRev ? `₹${activePt.d.revenue.toLocaleString('en-IN')}` : `${activePt.d.orders} orders`}
                      </span>
                    )}
                  </div>

                  <div className="relative w-full overflow-hidden">
                    <svg
                      viewBox={`0 0 ${svgW} ${svgH}`}
                      className="w-full h-38 sm:h-40 overflow-visible select-none"
                    >
                      <defs>
                        {/* Area Gradients */}
                        <linearGradient id="areaGradRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                          <stop offset="70%" stopColor="#10b981" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="areaGradOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                          <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Stroke Gradients */}
                        <linearGradient id="strokeGradRev" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#059669" />
                          <stop offset="50%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                        <linearGradient id="strokeGradOrders" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#1d4ed8" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Gridlines & Y-Axis Reference Marks */}
                      {[1, 0.5, 0].map((ratio) => {
                        const y = baseY - ratio * plotH;
                        const labelVal = Math.round(maxVal * ratio);
                        return (
                          <g key={ratio}>
                            <line
                              x1={padLeft}
                              y1={y}
                              x2={svgW - padRight}
                              y2={y}
                              stroke="currentColor"
                              className="text-gray-100 dark:text-gray-700/60"
                              strokeDasharray="4 4"
                              strokeWidth="1"
                            />
                            <text
                              x={padLeft - 8}
                              y={y + 3.5}
                              textAnchor="end"
                              className="text-[9px] font-bold fill-gray-400 select-none"
                            >
                              {isRev ? (labelVal >= 1000 ? `₹${Math.round(labelVal / 1000)}k` : `₹${labelVal}`) : labelVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* Smooth Filled Area */}
                      <path
                        d={areaPath}
                        fill={isRev ? 'url(#areaGradRev)' : 'url(#areaGradOrders)'}
                      />

                      {/* Smooth Stroke Line Curve */}
                      <path
                        d={linePath}
                        fill="none"
                        stroke={isRev ? 'url(#strokeGradRev)' : 'url(#strokeGradOrders)'}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data Point Nodes with Interactive Hover */}
                      {points.map((pt) => {
                        const isHovered = hoveredIndex === pt.i;
                        return (
                          <g
                            key={pt.i}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(pt.i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          >
                            {/* Vertical Highlight Bar on Hover */}
                            {isHovered && (
                              <line
                                x1={pt.x}
                                y1={padTop}
                                x2={pt.x}
                                y2={baseY}
                                stroke="currentColor"
                                className={isRev ? 'text-emerald-500' : 'text-blue-500'}
                                strokeDasharray="3 3"
                                strokeWidth="1.5"
                                opacity="0.6"
                              />
                            )}

                            {/* Outer Glow Ring */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? 7.5 : 4.5}
                              className={`transition-all duration-200 ${
                                isRev
                                  ? 'fill-emerald-100 dark:fill-emerald-950 stroke-emerald-600'
                                  : 'fill-blue-100 dark:fill-blue-950 stroke-blue-600'
                              }`}
                              strokeWidth={isHovered ? 2.5 : 1.5}
                            />

                            {/* Center Dot */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? 3.5 : 2.5}
                              className={isRev ? 'fill-emerald-600' : 'fill-blue-600'}
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Day of Week Labels Row */}
                  <div className="grid grid-cols-7 gap-1 text-center pt-1 border-t border-gray-100 dark:border-gray-700/60">
                    {chartData.map((d, i) => (
                      <button
                        key={d.date}
                        onClick={() => setHoveredIndex(i)}
                        onMouseEnter={() => setHoveredIndex(i)}
                        className={`rounded-lg py-1 px-0.5 transition cursor-pointer ${
                          hoveredIndex === i
                            ? isRev
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-black'
                              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 font-black'
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                        }`}
                      >
                        <span className="block text-[10px] font-extrabold">
                          {d.dayOfWeek}
                        </span>
                        <span className="block text-[9px] text-gray-400 font-semibold truncate">
                          {isRev ? `₹${d.revenue}` : d.orders}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Recent Activity Card (Replacing Live Highlights as previously had) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  Recent Activity
                </h3>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Live Stream</span>
            </div>

            {/* Scrollable Activity Stream */}
            <div className="mt-2.5 max-h-[235px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-100 dark:divide-gray-700/50">
              {loading ? (
                <div className="py-8 text-center text-xs text-gray-400 animate-pulse">
                  Loading recent activity...
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  No recent activity to display.
                </div>
              ) : (
                recentActivity.slice(0, 10).map((item) => {
                  const isOrder = item.type === 'order';
                  const isProduct = item.type === 'product';
                  const isVendor = item.type === 'vendor';

                  return (
                    <div
                      key={item.id}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-3 hover:bg-gray-50/60 dark:hover:bg-gray-700/30 p-1.5 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isOrder
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : isProduct
                              ? 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400'
                              : isVendor
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400'
                          }`}
                        >
                          {isOrder && <ShoppingCart size={15} />}
                          {isProduct && <Package size={15} />}
                          {isVendor && <Store size={15} />}
                          {!isOrder && !isProduct && !isVendor && <Users size={15} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-0.5">
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                            item.status === 'Delivered' || item.status === 'Verified' || item.status?.includes('stock')
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                              : item.status === 'Cancelled'
                              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="text-[9px] text-gray-400 shrink-0 font-medium">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2.5 border-t border-gray-100 dark:border-gray-700 mt-2 grid grid-cols-2 gap-2">
            <Link
              href="/admin/products/create"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center text-xs font-bold transition shadow-xs"
            >
              + Add Product
            </Link>
            <Link
              href="/admin/orders"
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl text-center text-xs font-bold transition"
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs for Newly Added Feeds */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Updates' },
            { id: 'products', label: `New Products (${recentProducts.length})` },
            { id: 'orders', label: `Recent Orders (${recentOrders.length})` },
            { id: 'vendors', label: `New Vendors (${recentVendors.length})` },
            { id: 'users', label: `New Users (${recentUsers.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${activeTab === t.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
          Compact Feed
        </span>
      </div>

      {/* 4-Feed Grid: Newly Added Products, Orders, Vendors, Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Newly Added Products */}
        {(activeTab === 'all' || activeTab === 'products') && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Newly Added Products
                  </h3>
                </div>
                <Link href="/admin/products" className="text-[10px] font-bold text-emerald-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700/60 mt-1">
                {recentProducts.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No products found.</p>
                ) : (
                  recentProducts.slice(0, 5).map((p: any) => (
                    <div key={p._id} className="py-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {p.product_image ? (
                          <img src={p.product_image} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-50 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black shrink-0">
                            {p.product_name?.charAt(0) || 'P'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {p.product_name}
                          </p>
                          <span className="text-[10px] text-gray-400 truncate block">
                            ₹{p.selling_price} • {p.vendor_shop_name || p.category || 'Fresh'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0 border border-emerald-100">
                        {p.stock ?? 0} in stock
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/admin/products"
              className="mt-2 text-center text-[11px] font-bold text-gray-500 hover:text-emerald-600 pt-2 border-t border-gray-100 dark:border-gray-700 block"
            >
              Go to Product Management &rarr;
            </Link>
          </div>
        )}

        {/* 2. Newly Placed Orders */}
        {(activeTab === 'all' || activeTab === 'orders') && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Recent Orders
                  </h3>
                </div>
                <Link href="/admin/orders" className="text-[10px] font-bold text-blue-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700/60 mt-1">
                {recentOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No orders yet.</p>
                ) : (
                  recentOrders.slice(0, 5).map((o: any) => (
                    <div key={o._id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          #{o.order_number || o._id.toString().slice(-6)}
                        </p>
                        <span className="text-[10px] text-gray-400 truncate block">
                          {o.user_id?.name || o.customer_name || 'Customer'} • ₹{o.total_amount?.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 block">
                          {o.orderStatus || 'Placed'}
                        </span>
                        <span className="text-[9px] text-gray-400 block mt-0.5">
                          {formatTimeAgo(o.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/admin/orders"
              className="mt-2 text-center text-[11px] font-bold text-gray-500 hover:text-blue-600 pt-2 border-t border-gray-100 dark:border-gray-700 block"
            >
              Go to Order Processing &rarr;
            </Link>
          </div>
        )}

        {/* 3. Newly Added Vendors */}
        {(activeTab === 'all' || activeTab === 'vendors') && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    New Vendors
                  </h3>
                </div>
                <Link href="/admin/vendors" className="text-[10px] font-bold text-amber-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700/60 mt-1">
                {recentVendors.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No vendors registered.</p>
                ) : (
                  recentVendors.slice(0, 5).map((v: any) => (
                    <div key={v._id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {v.shop_name || v.full_name}
                        </p>
                        <span className="text-[10px] text-gray-400 truncate block">
                          {v.full_name} • {v.mobile_no || v.email || 'Vendor'}
                        </span>
                      </div>

                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${v.is_verified === '1'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                        {v.is_verified === '1' ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/admin/vendors"
              className="mt-2 text-center text-[11px] font-bold text-gray-500 hover:text-amber-600 pt-2 border-t border-gray-100 dark:border-gray-700 block"
            >
              Go to Vendor Management &rarr;
            </Link>
          </div>
        )}

        {/* 4. Newly Registered Users */}
        {(activeTab === 'all' || activeTab === 'users') && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-cyan-600" />
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    New Users
                  </h3>
                </div>
                <Link href="/admin/users" className="text-[10px] font-bold text-cyan-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700/60 mt-1">
                {recentUsers.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No users registered.</p>
                ) : (
                  recentUsers.slice(0, 5).map((u: any) => (
                    <div key={u._id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {u.name || 'Registered Customer'}
                        </p>
                        <span className="text-[10px] text-gray-400 truncate block">
                          {u.mobile_no || u.email || 'Active Account'}
                        </span>
                      </div>

                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 shrink-0 capitalize">
                        {u.role || 'user'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/admin/users"
              className="mt-2 text-center text-[11px] font-bold text-gray-500 hover:text-cyan-600 pt-2 border-t border-gray-100 dark:border-gray-700 block"
            >
              Go to User Directory &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function CompactStatCard({
  title,
  value,
  trend,
  icon,
  accent,
}: {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'blue' | 'violet' | 'amber' | 'cyan';
}) {
  const accentBg = {
    emerald: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-100/80 dark:border-emerald-900/30',
    blue: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-100/80 dark:border-blue-900/30',
    violet: 'bg-violet-50/80 dark:bg-violet-950/40 border-violet-100/80 dark:border-violet-900/30',
    amber: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-100/80 dark:border-amber-900/30',
    cyan: 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-100/80 dark:border-cyan-900/30',
  }[accent];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-3.5 sm:p-4 border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-1.5 rounded-xl border ${accentBg}`}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          {value}
        </h3>
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 truncate mt-0.5">
          {trend}
        </p>
      </div>
    </div>
  );
}
