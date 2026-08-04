"use client";
import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { Column, Action, BulkAction } from '../components/DataTable';
import { Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
interface Banner { _id: string; title: string; subtitle?: string; image?: string; link?: string; category_id?: string; is_active: string; sort_order: number; }
export default function BannerListPage() {
  const [data, setData] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/banners`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data || []);
      setTotal(json.meta?.total || 0);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const deleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete banner');
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const columns: Column<Banner>[] = [
    { key: 'image', label: 'Image', render: (row) => row.image ? <img src={row.image} alt={row.title} className="h-12 w-24 object-cover rounded" /> : <div className="h-12 w-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Image</div> },
    { key: 'title', label: 'Title', render: (row) => <span className="font-semibold">{row.title || 'No Title'}</span> },
    { key: 'category_id', label: 'Linked Category', render: (row) => row.category_id ? <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{row.category_id}</span> : <span className="text-gray-400">None</span> },
    { key: 'link', label: 'Link' },
    { key: 'sort_order', label: 'Order' },
    { key: 'is_active', label: 'Status', render: (row) => <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.is_active === '1' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{row.is_active === '1' ? 'Active' : 'Inactive'}</span> },
  ];

  const actions: Action<Banner>[] = [
    { label: 'Delete', icon: <Trash2 size={16} />, onClick: (row) => deleteBanner(row._id), color: 'danger' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Banner List</h1><p className="text-sm text-gray-500 mt-1">Manage homepage banners</p></div>
        <Link href="/admin/banner-list/create">
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-medium"><Plus size={16} /> New Banner</button>
        </Link>
      </div>
      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
      <DataTable data={data} columns={columns} actions={actions} keyExtractor={(row) => row._id} loading={loading} />
    </div>
  );
}
