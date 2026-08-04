"use client";

import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { Column, Action, BulkAction } from '../components/DataTable';
import { Trash2, Plus, Tag } from 'lucide-react';
import Link from 'next/link';

interface Coupon {
  _id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  is_active: string;
  expires_at: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/coupons`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setCoupons(json.data || []);
      setTotal(json.meta?.total || 0);
    } catch (e: any) { setError(e.message || 'Failed to load coupons'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: Column<Coupon>[] = [
    { key: 'code', label: 'Coupon Code', render: (row) => (
      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded">{row.code}</span>
    )},
    { key: 'discount_type', label: 'Type', render: (row) => (
      <span className="capitalize">{row.discount_type === 'percent' ? `${row.discount_value}% Off` : `₹${row.discount_value} Flat`}</span>
    )},
    { key: 'min_order', label: 'Min. Order', render: (row) => <span>₹{row.min_order}</span> },
    { key: 'used_count', label: 'Usage', render: (row) => <span>{row.used_count} / {row.max_uses}</span> },
    { key: 'expires_at', label: 'Expiry', render: (row) => <span>{row.expires_at ? new Date(row.expires_at).toLocaleDateString('en-IN') : '-'}</span> },
    { key: 'is_active', label: 'Status', render: (row) => (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.is_active === '1' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {row.is_active === '1' ? 'Active' : 'Inactive'}
      </span>
    )},
  ];

  const actions: Action<Coupon>[] = [
    {
      label: 'Delete', icon: <Trash2 size={15} />, color: 'danger',
      onClick: async (row) => {
        if (!confirm(`"${row.code}" coupon delete करें?`)) return;
        await fetch(`/api/coupons/${row._id}`, { method: 'DELETE' });
        fetchData();
      }
    },
  ];

  const bulkActions: BulkAction[] = [{
    label: 'Delete Selected', icon: <Trash2 size={14} />, color: 'danger',
    onClick: async (ids) => {
      if (!confirm(`${ids.length} coupons delete करें?`)) return;
      await Promise.all(ids.map(id => fetch(`/api/coupons/${id}`, { method: 'DELETE' })));
      fetchData();
    }
  }];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coupon Codes</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} coupons</p>
        </div>
        <Link href="/admin/coupons/create">
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-medium">
            <Plus size={16} /> New Coupon
          </button>
        </Link>
      </div>
      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error} — <button onClick={fetchData} className="underline">Retry</button></div>}
      <DataTable data={coupons} columns={columns} actions={actions} bulkActions={bulkActions} keyExtractor={(row) => row._id} loading={loading} />
    </div>
  );
}
