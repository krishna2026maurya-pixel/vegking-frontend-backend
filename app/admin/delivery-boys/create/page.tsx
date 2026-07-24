"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateDeliveryBoyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', mobile_number: '', email: '', vehicle_type: 'Bike', vehicle_number: '', city: '', is_verified: '0', is_active: '1',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await fetch(`/api/delivery-boys`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, wallet_balance: 0 }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push('/admin/delivery-boys');
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/delivery-boys"><button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" /></button></Link>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Delivery Boy</h1><p className="text-sm text-gray-500">नया delivery boy जोड़ें</p></div>
      </div>
      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Personal Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
            <input value={form.name} onChange={set('name')} required placeholder="e.g. Suresh Das" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number *</label>
              <input value={form.mobile_number} onChange={set('mobile_number')} required placeholder="10-digit mobile" maxLength={10} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="email@example.com" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
            <input value={form.city} onChange={set('city')} placeholder="e.g. Mumbai" className={inputCls} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Vehicle Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Type</label>
              <select value={form.vehicle_type} onChange={set('vehicle_type')} className={inputCls}>
                <option>Bike</option><option>Scooter</option><option>Cycle</option><option>Van</option><option>Auto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Number</label>
              <input value={form.vehicle_number} onChange={set('vehicle_number')} placeholder="e.g. MH12-AB-1234" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verification Status</label>
              <select value={form.is_verified} onChange={set('is_verified')} className={inputCls}>
                <option value="0">Pending Verification</option><option value="1">Verified</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Active Status</label>
              <select value={form.is_active} onChange={set('is_active')} className={inputCls}>
                <option value="1">Active</option><option value="0">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <Link href="/admin/delivery-boys"><button type="button" className="px-5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button></Link>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium shadow-sm">
            <Save size={16} />{saving ? 'Saving...' : 'Save Delivery Boy'}
          </button>
        </div>
      </form>
    </div>
  );
}
