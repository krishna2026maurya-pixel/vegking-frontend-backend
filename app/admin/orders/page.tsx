"use client";

import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { Column, Action, BulkAction } from '../components/DataTable';
import { Eye, Trash2, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';

interface Order {
  _id: string;
  order_number: string;
  customer_mobile: string;
  total_amount: number;
  payment_method: 'COD' | 'ONLINE';
  payment_status: 'pending' | 'completed' | 'failed';
  status: number;
  orderStatus: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  'Order Placed':     { label: 'Order Placed',     color: 'bg-yellow-100 text-yellow-800' },
  'Order Confirmed':  { label: 'Order Confirmed',  color: 'bg-blue-100 text-blue-800' },
  'Packing':          { label: 'Packing',          color: 'bg-purple-100 text-purple-800' },
  'Out for Delivery': { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800' },
  'Delivered':        { label: 'Delivered',        color: 'bg-green-100 text-green-800' },
  'Cancelled':        { label: 'Cancelled',        color: 'bg-red-100 text-red-800' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [statusModal, setStatusModal] = useState<{ open: boolean; orderId: string | null; current: string }>({ open: false, orderId: null, current: 'Order Placed' });
  const limit = 10;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
      if (filterStatus !== '') params.set('status', filterStatus);
      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setOrders(json.data || []);
      setTotalPages(json.meta?.totalPages || 1);
      setTotal(json.meta?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const applyStatus = async (newStatus: string) => {
    if (!statusModal.orderId) return;
    try {
      const legacyMap: Record<string, number> = { 'Order Placed': 0, 'Order Confirmed': 1, 'Packing': 2, 'Out for Delivery': 3, 'Delivered': 4, 'Cancelled': 5 };
      const res = await fetch(`/api/orders/${statusModal.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus, status: legacyMap[newStatus] }),
      });
      if (!res.ok) throw new Error('Update failed');
      fetchOrders();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setStatusModal({ open: false, orderId: null, current: 'Order Placed' });
    }
  };

  const columns: Column<Order>[] = [
    { key: 'order_number', label: 'Order No.' },
    { key: 'customer_mobile', label: 'Customer' },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (row) => <span className="font-semibold">₹{(row.total_amount ?? 0).toFixed(2)}</span>
    },
    {
      key: 'payment_method',
      label: 'Payment',
      render: (row) => (
        <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full',
          row.payment_method === 'COD' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
        )}>
          {row.payment_method}
        </span>
      )
    },
    {
      key: 'payment_status',
      label: 'Pay Status',
      render: (row) => (
        <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full',
          row.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
          row.payment_status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
        )}>{row.payment_status}</span>
      )
    },
    {
      key: 'orderStatus' as keyof Order,
      label: 'Status',
      render: (row) => {
        const s = statusMap[row.orderStatus] ?? { label: row.orderStatus || 'Unknown', color: 'bg-gray-100 text-gray-800' };
        return <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full', s.color)}>{s.label}</span>;
      }
    },
    { key: 'created_at', label: 'Created At' },
  ];

  const actions: Action<Order>[] = [
    {
      label: 'View',
      icon: <Eye size={15} />,
      onClick: (row) => window.open(`/admin/orders/${row._id}`, '_blank'),
      color: 'default'
    },
    {
      label: 'Change Status',
      icon: <ArrowUpDown size={15} />,
      onClick: (row) => setStatusModal({ open: true, orderId: row._id, current: row.orderStatus || 'Order Placed' }),
      color: 'success'
    },
    {
      label: 'Delete',
      icon: <Trash2 size={15} />,
      onClick: async (row) => {
        if (!confirm(`Order ${row.order_number} delete करें?`)) return;
        await fetch(`/api/orders/${row._id}`, { method: 'DELETE' });
        fetchOrders();
      },
      color: 'danger'
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      label: 'Delete Selected',
      icon: <Trash2 size={14} />,
      onClick: async (ids) => {
        if (!confirm(`${ids.length} orders delete करें?`)) return;
        await Promise.all(ids.map(id => fetch(`/api/orders/${id}`, { method: 'DELETE' })));
        fetchOrders();
      },
      color: 'danger'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} orders</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error} — <button onClick={fetchOrders} className="underline">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search order no, mobile..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">All Status</option>
          {Object.entries(statusMap).map(([val, s]) => (
            <option key={val} value={val}>{s.label}</option>
          ))}
        </select>
      </div>

      <DataTable
        data={orders}
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
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {statusModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-80">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Change Order Status</h3>
            <select
              value={statusModal.current}
              onChange={(e) => setStatusModal(m => ({ ...m, current: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {Object.entries(statusMap).map(([val, s]) => (
                <option key={val} value={val}>{s.label}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setStatusModal({ open: false, orderId: null, current: 'Order Placed' })}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >Cancel</button>
              <button
                onClick={() => applyStatus(statusModal.current)}
                className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
