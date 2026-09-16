"use client";
import React from 'react';
import { FileText } from 'lucide-react';
export default function OtherDataPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Other Data</h1><p className="text-sm text-gray-500 mt-1">Miscellaneous application data</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Verify OTPs', 'Personal Access Tokens', 'Migrations'].map(item => (
          <div key={item} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><FileText size={24} className="text-gray-500" /></div>
            <div><p className="font-semibold text-gray-900 dark:text-white">{item}</p><p className="text-sm text-gray-500">View & manage {item.toLowerCase()}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
