"use client";

import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { Column, Action, BulkAction } from '../components/DataTable';
import { Eye, Trash2, Plus, Edit } from 'lucide-react';
import Link from 'next/link';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  is_active: string;
  sort_order: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const limit = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
      const res = await fetch(`/api/categories?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setCategories(json.data || []);
      setTotalPages(json.meta?.totalPages || 1);
      setTotal(json.meta?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: Column<Category>[] = [
    {
      key: 'image',
      label: 'Image',
      render: (row) => (
        row.image ? (
          <img src={row.image} alt={row.name} className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold">
            {row.name?.charAt(0) || 'C'}
          </div>
        )
      )
    },
    { key: 'name', label: 'Category Name', render: (row) => <span className="font-semibold text-gray-900 dark:text-white">{row.name}</span> },
    { key: 'slug', label: 'Slug' },
    { key: 'sort_order', label: 'Sort Order' },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          row.is_active === '1' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {row.is_active === '1' ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ];

  const actions: Action<Category>[] = [
    { label: 'Edit', icon: <Edit size={15} />, onClick: (row) => window.location.href = `/admin/categories/${row._id}`, color: 'default' },
    {
      label: 'Delete',
      icon: <Trash2 size={15} />,
      color: 'danger',
      onClick: async (row) => {
        if (!confirm(`"${row.name}" category को delete करें?`)) return;
        await fetch(`/api/categories/${row._id}`, { method: 'DELETE' });
        fetchData();
      }
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      label: 'Delete Selected',
      icon: <Trash2 size={14} />,
      color: 'danger',
      onClick: async (ids) => {
        if (!confirm(`${ids.length} categories delete करें?`)) return;
        await Promise.all(ids.map(id => fetch(`/api/categories/${id}`, { method: 'DELETE' })));
        fetchData();
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} categories</p>
        </div>
        <Link href="/admin/categories/create">
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-medium">
            <Plus size={16} /> New Category
          </button>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error} — <button onClick={fetchData} className="underline">Retry</button>
        </div>
      )}

      <div>
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <DataTable
        data={categories}
        columns={columns}
        actions={actions}
        bulkActions={bulkActions}
        keyExtractor={(row) => row._id}
        loading={loading}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
