"use client";
import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { Column, Action } from '../components/DataTable';
import { CheckCircle } from 'lucide-react';

interface DeliveryBoy { _id: string; name: string; mobile_number: string; email: string; vehicle_type: string; city: string; is_verified: string; }

export default function PendingDeliveryBoysPage() {
  const [data, setData] = useState<DeliveryBoy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/delivery-boys?limit=100`);
      const json = await res.json();
      setData((json.data || []).filter((d: DeliveryBoy) => d.is_verified === '0'));
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);
  
  useEffect(() => { fetchData(); }, [fetchData]);
  
  const columns: Column<DeliveryBoy>[] = [
    { key: 'avatar', label: '', render: (row) => <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm">{row.name?.charAt(0)}</div> },
    { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-gray-900 dark:text-white">{row.name}</span> },
    { key: 'mobile_number', label: 'Mobile' },
    { key: 'email', label: 'Email' },
    { key: 'vehicle_type', label: 'Vehicle' },
    { key: 'city', label: 'City' },
  ];
  
  const actions: Action<DeliveryBoy>[] = [
    { label: 'Approve', icon: <CheckCircle size={15} />, color: 'success',
      onClick: async (row) => {
        await fetch(`/api/delivery-boys/${row._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_verified: '1' }) });
        fetchData();
      }
    },
  ];
  
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Delivery Boys</h1><p className="text-sm text-gray-500 mt-1">{data.length} pending verification</p></div>
      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
      <DataTable data={data} columns={columns} actions={actions} keyExtractor={(row) => row._id} loading={loading} />
    </div>
  );
}
