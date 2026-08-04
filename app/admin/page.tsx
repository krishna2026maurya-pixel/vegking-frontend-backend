"use client";

import React from 'react';
import { Users, ShoppingCart, DollarSign, Package, Download } from 'lucide-react';

export default function AdminDashboard() {
  const downloadReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Metric,Value,Trend",
         "Total Vendors,124,+12% this month",
         "Total Products,856,+5% this month",
         "Total Orders,1245,+18% this month",
         "Total Revenue,Rs 45600,+24% this month"
        ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vegking_admin_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <button 
          onClick={downloadReport}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-1.5 text-sm font-semibold"
        >
          <Download size={16} />
          Download Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Vendors" value="124" icon={<Users className="text-blue-500" size={24} />} trend="+12% this month" />
        <StatCard title="Total Products" value="856" icon={<Package className="text-purple-500" size={24} />} trend="+5% this month" />
        <StatCard title="Total Orders" value="1,245" icon={<ShoppingCart className="text-green-500" size={24} />} trend="+18% this month" />
        <StatCard title="Total Revenue" value="₹45,600" icon={<DollarSign className="text-orange-500" size={24} />} trend="+24% this month" />
      </div>

      {/* Recent Activity placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>No recent activity to display.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="mt-4 text-sm text-green-600 dark:text-green-400">
        {trend}
      </div>
    </div>
  );
}
