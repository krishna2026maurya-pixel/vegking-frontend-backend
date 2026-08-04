"use client";

import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { Column, Action, BulkAction } from '../components/DataTable';
import { Eye, Trash2, Plus, Pencil, Filter } from 'lucide-react';
import Link from 'next/link';

interface Product {
  _id: string;
  product_name: string;
  brand: string;
  mrp: number;
  selling_price: number;
  stock_status: number;
  vendor_shop_name: string;
  gst: number;
  product_image?: string;
}

interface Vendor {
  _id: string;
  shop_name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [error, setError] = useState('');
  const limit = 10;

  // Load Vendors for Filter
  useEffect(() => {
    fetch(`/api/vendors?limit=1000`)
      .then(r => r.json())
      .then(j => setVendors(j.data || []))
      .catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        vendor_id: vendorId
      });
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setProducts(json.data || []);
      setTotalPages(json.meta?.totalPages || 1);
      setTotal(json.meta?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, vendorId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: Column<Product>[] = [
    {
      key: 'product_image',
      label: '',
      render: (row) => (
        row.product_image ? (
          <img src={row.product_image} alt={row.product_name} className="w-9 h-9 rounded-lg object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
            {row.product_name?.charAt(0) || 'P'}
          </div>
        )
      )
    },
    { key: 'product_name', label: 'Product Name' },
    {
      key: 'stock_status',
      label: 'Stock',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
          (row.stock_status ?? 0) <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {row.stock_status ?? 0}
        </span>
      )
    },
    { key: 'quantity', label: 'Pack Qty' },
    { key: 'mrp', label: 'MRP', render: (row) => <span>₹{row.mrp ?? 0}</span> },
    {
      key: 'selling_price',
      label: 'Selling Price',
      render: (row) => <span className="font-semibold text-green-600">₹{row.selling_price ?? 0}</span>
    },
    { key: 'gst', label: 'GST', render: (row) => <span>{row.gst ?? 0}%</span> },
    { key: 'vendor_shop_name', label: 'Vendor' },
  ];

  const actions: Action<Product>[] = [
    {
      label: 'Edit',
      icon: <Pencil size={15} />,
      onClick: (row) => window.location.href = `/admin/products/${row._id}`,
      color: 'default'
    },
    {
      label: 'View',
      icon: <Eye size={15} />,
      onClick: (row) => window.open(`/admin/products/${row._id}`, '_blank'),
      color: 'default'
    },
    {
      label: 'Delete',
      icon: <Trash2 size={15} />,
      color: 'danger',
      onClick: async (row) => {
        if (!confirm(`Delete "${row.product_name}"?`)) return;
        await fetch(`/api/products/${row._id}`, { method: 'DELETE' });
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
        if (!confirm(`Delete ${ids.length} selected products?`)) return;
        await Promise.all(ids.map(id => fetch(`/api/products/${id}`, { method: 'DELETE' })));
        fetchData();
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} products</p>
        </div>
        <Link href="/admin/products/create">
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-medium">
            <Plus size={16} /> New Product
          </button>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error} — <button onClick={fetchData} className="underline">Retry</button>
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative">
           <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Vendor Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={vendorId}
            onChange={(e) => { setVendorId(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[200px]"
          >
            <option value="">All Vendors</option>
            {vendors.map(v => (
              <option key={v._id} value={v._id}>{v.shop_name}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        data={products}
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
