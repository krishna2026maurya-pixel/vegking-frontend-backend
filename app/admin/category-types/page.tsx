"use client";

import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { Column, Action, BulkAction } from '../components/DataTable';
import { Trash2, Plus } from 'lucide-react';
import Link from 'next/link';

interface CategoryType {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  description?: string;
  is_active: string;
}

export default function CategoryTypesPage() {
  const [data, setData] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/category-types?limit=100`);
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.meta?.total || 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: Column<CategoryType>[] = [
    {
      key: 'image',
      label: 'Image',
      render: (row) => (
        row.image ? (
          <img src={row.image.startsWith('/') || row.image.startsWith('http') ? row.image : `/uploads/${row.image}`} alt={row.name} className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold">
            {row.name?.charAt(0) || 'C'}
          </div>
        )
      )
    },
    { key: 'name', label: 'Category Type Name', render: (row) => <span className="font-semibold text-gray-900 dark:text-white">{row.name}</span> },
    { key: 'slug', label: 'Slug' },
    { key: 'sort_order', label: 'Sort Order' },
    { key: 'is_active', label: 'Status', render: (row) => (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.is_active === '1' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {row.is_active === '1' ? 'Active' : 'Inactive'}
      </span>
    )},
  ];

  const actions: Action<CategoryType>[] = [
    { label: 'Edit', icon: <span className="text-blue-500">Edit</span>, onClick: (row) => window.location.href = `/admin/category-types/${row._id}`, color: 'default' },
    { label: 'Delete', icon: <Trash2 size={15} />, color: 'danger',
      onClick: async (row) => {
        if (!confirm(`"${row.name}" delete करें?`)) return;
        await fetch(`/api/category-types/${row._id}`, { method: 'DELETE' });
        fetchData();
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Category Types</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} category types</p>
        </div>
        <Link href="/admin/category-types/create">
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-medium">
            <Plus size={16} /> New Category Type
          </button>
        </Link>
      </div>
      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error} — <button onClick={fetchData} className="underline">Retry</button></div>}
      <DataTable data={data} columns={columns} actions={actions} keyExtractor={(row) => row._id} loading={loading} />
    </div>
  );
}
