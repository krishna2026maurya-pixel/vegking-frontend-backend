"use client";
import React, { useState } from 'react';
import { Save, Settings } from 'lucide-react';
export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500";
  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1><p className="text-sm text-gray-500 mt-1">Manage application settings</p></div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">General Settings</h2>
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">App Name</label><input defaultValue="VegKing" className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Email</label><input defaultValue="info@vegking.com" className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Phone</label><input defaultValue="+91 9876543210" className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label><input defaultValue="INR (₹)" className={inputCls} /></div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Delivery Settings</h2>
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min. Delivery Charge (₹)</label><input type="number" defaultValue="20" className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Free Delivery Above (₹)</label><input type="number" defaultValue="299" className={inputCls} /></div>
      </div>
      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm">
          <Save size={16} />{saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
