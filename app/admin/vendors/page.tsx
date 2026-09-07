"use client";

import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { Column, Action, BulkAction } from '../components/DataTable';
import { Edit, Eye, Trash2, CheckCircle, XCircle, UserCheck, Plus } from 'lucide-react';
import Link from 'next/link';

interface Vendor {
  _id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  shop_name: string;
  is_verified: string;
  is_bestseller: string;
  wallet_balance: number;
  created_at: string;
  city: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const limit = 10;

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
      const res = await fetch(`/api/vendors?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setVendors(json.data || []);
      setTotalPages(json.meta?.totalPages || 1);
      setTotal(json.meta?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const toggleVerify = async (vendor: Vendor) => {
    try {
      const newVal = vendor.is_verified === '1' ? '0' : '1';
      const res = await fetch(`/api/vendors/${vendor._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: newVal }),
      });
      if (!res.ok) throw new Error('Update failed');
      fetchVendors();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const deleteVendor = async (vendor: Vendor) => {
    if (!confirm(`Are you sure you want to delete "${vendor.shop_name}"?`)) return;
    try {
      const res = await fetch(`/api/vendors/${vendor._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      fetchVendors();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/vendors/${editingVendor._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editingVendor.full_name,
          shop_name: editingVendor.shop_name,
          mobile_number: editingVendor.mobile_number,
          mobile_no: editingVendor.mobile_number,
          email: editingVendor.email,
          city: editingVendor.city,
          wallet_balance: Number(editingVendor.wallet_balance || 0),
          is_verified: editingVendor.is_verified,
          is_bestseller: editingVendor.is_bestseller,
        }),
      });
      if (!res.ok) throw new Error('Failed to update vendor');
      setEditingVendor(null);
      fetchVendors();
    } catch (err: any) {
      alert(err.message || 'Error updating vendor');
    } finally {
      setSavingEdit(false);
    }
  };

  const columns: Column<Vendor>[] = [
    {
      key: 'shop_image',
      label: 'Shop',
      render: (row) => (
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
          {row.shop_name?.charAt(0) || '?'}
        </div>
      )
    },
    { key: 'full_name', label: 'Full Name' },
    {
      key: 'mobile_number',
      label: 'Mobile',
      render: (row) => <span>{row.mobile_number || (row as any).mobile_no || '-'}</span>
    },
    { key: 'shop_name', label: 'Shop Name' },
    {
      key: 'city',
      label: 'City',
      render: (row) => <span>{row.city || (row as any).address || '-'}</span>
    },
    {
      key: 'wallet_balance',
      label: 'Wallet',
      render: (row) => <span className="font-semibold">₹{(row.wallet_balance ?? 0).toFixed(2)}</span>
    },
    {
      key: 'is_verified',
      label: 'Verified',
      render: (row) => row.is_verified === '1'
        ? <CheckCircle size={18} className="text-green-500" />
        : <XCircle size={18} className="text-red-400" />
    },
    {
      key: 'is_bestseller',
      label: 'Bestseller',
      render: (row) => row.is_bestseller === '1'
        ? <CheckCircle size={18} className="text-green-500" />
        : <XCircle size={18} className="text-gray-300" />
    }
  ];

  const actions: Action<Vendor>[] = [
    {
      label: 'View Details',
      icon: <Eye size={15} />,
      onClick: (row) => window.open(`/admin/vendors/${row._id}`, '_blank'),
      color: 'default'
    },
    {
      label: 'Edit',
      icon: <Edit size={15} />,
      onClick: (row) => setEditingVendor({ ...row }),
      color: 'default'
    },
    {
      label: 'Toggle Verify',
      icon: <UserCheck size={15} />,
      onClick: toggleVerify,
      color: 'success'
    },
    {
      label: 'Delete',
      icon: <Trash2 size={15} />,
      onClick: deleteVendor,
      color: 'danger'
    }
  ];

  const bulkActions: BulkAction[] = [
    {
      label: 'Delete Selected',
      icon: <Trash2 size={14} />,
      onClick: async (ids) => {
        if (!confirm(`Delete ${ids.length} vendors?`)) return;
        await Promise.all(ids.map(id => fetch(`/api/vendors/${id}`, { method: 'DELETE' })));
        fetchVendors();
      },
      color: 'danger'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} vendors in database</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchVendors}
            className="px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-xs"
          >
            ↻ Refresh
          </button>
          <Link href="/admin/vendors/create">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium">
              <Plus size={16} />
              New Vendor
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error} — <button onClick={fetchVendors} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by name, mobile, shop, city..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-xs"
        />
      </div>

      <DataTable
        data={vendors}
        columns={columns}
        actions={actions}
        bulkActions={bulkActions}
        keyExtractor={(row) => row._id}
        loading={loading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Edit Vendor: {editingVendor.shop_name}</h3>
              <button
                type="button"
                onClick={() => setEditingVendor(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingVendor.full_name || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, full_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Shop Name</label>
                  <input
                    type="text"
                    value={editingVendor.shop_name || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, shop_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile</label>
                  <input
                    type="text"
                    value={editingVendor.mobile_number || editingVendor.mobile_no || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, mobile_number: e.target.value, mobile_no: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingVendor.email || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, email: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input
                    type="text"
                    value={editingVendor.city || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, city: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Wallet Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingVendor.wallet_balance ?? 0}
                    onChange={(e) => setEditingVendor({ ...editingVendor, wallet_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingVendor.is_verified === '1'}
                    onChange={(e) => setEditingVendor({ ...editingVendor, is_verified: e.target.checked ? '1' : '0' })}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Verified Vendor</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingVendor.is_bestseller === '1'}
                    onChange={(e) => setEditingVendor({ ...editingVendor, is_bestseller: e.target.checked ? '1' : '0' })}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Bestseller Badge</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition shadow-sm disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
