"use client";
import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { Column, Action } from '../components/DataTable';
import { Eye, Bike } from 'lucide-react';

interface DeliveryBoy {
  _id: string;
  name: string;
  mobile_number: string;
  vehicle_type: string;
  vehicle_number: string;
  city?: string;
  is_active: string;
  wallet_balance: number;
  vendor_id?: { shop_name: string } | null;
}

export default function ActiveDeliveryBoysPage() {
  const [data, setData] = useState<DeliveryBoy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/delivery-boys?is_active=1&limit=100`);
      const json = await res.json();
      setData(json.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleOffline = async (boy: DeliveryBoy) => {
    try {
      await fetch(`/api/delivery-boys/${boy._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: '0' }),
      });
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const columns: Column<DeliveryBoy>[] = [
    {
      key: 'avatar',
      label: '',
      render: (row) => (
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
          {row.name?.charAt(0)}
        </div>
      )
    },
    { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-gray-900 dark:text-white">{row.name}</span> },
    { key: 'mobile_number', label: 'Mobile' },
    { key: 'vehicle_type', label: 'Vehicle' },
    { key: 'vehicle_number', label: 'Vehicle No.' },
    {
      key: 'vendor_id',
      label: 'Affiliation',
      render: (row) => <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{row.vendor_id?.shop_name || 'Global / Platform'}</span>
    },
    {
      key: 'is_active',
      label: 'Live Status',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          Online
        </span>
      )
    },
    { key: 'wallet_balance', label: 'Wallet', render: (row) => <span>₹{(row.wallet_balance ?? 0).toFixed(2)}</span> },
  ];

  const actions: Action<DeliveryBoy>[] = [
    { label: 'View', icon: <Eye size={15} />, onClick: (row) => window.open(`/admin/delivery-boys/${row._id}`, '_blank'), color: 'default' },
    { label: 'Mark Offline', icon: <Bike size={15} />, onClick: toggleOffline, color: 'danger' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active (Online) Delivery Boys</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {data.length} delivery boys currently online and ready to deliver</p>
        </div>
        <button
          onClick={fetchData}
          className="px-3.5 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition"
        >
          ↻ Refresh
        </button>
      </div>
      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
      <DataTable data={data} columns={columns} actions={actions} keyExtractor={(row) => row._id} loading={loading} />
    </div>
  );
}
