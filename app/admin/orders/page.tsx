"use client";

import React, { useEffect, useState, useCallback } from 'react';
import DataTable, { Column, Action, BulkAction } from '../components/DataTable';
import { Eye, Trash2, ArrowUpDown, Bike, RotateCw } from 'lucide-react';
import clsx from 'clsx';
import { getAllowedNextStatuses, canTransitionStatus, normalizeOrderStatus } from '@/lib/order-status-rules';

interface Order {
  _id: string;
  order_number: string;
  customer_name?: string;
  customer_mobile?: string;
  user_id?: {
    _id: string;
    name?: string;
    email?: string;
    mobile_no?: string;
    phone?: string;
  } | null;
  shippingAddress?: any;
  total_amount: number;
  payment_method: 'COD' | 'ONLINE';
  payment_status: 'pending' | 'completed' | 'failed';
  status: number;
  orderStatus: string;
  created_at?: string;
  createdAt?: string;
  delivery_boy_id?: {
    _id: string;
    name: string;
    mobile_number?: string;
    is_active?: string;
    vehicle_type?: string;
  } | null;
}

const statusMap: Record<string, { label: string; color: string }> = {
  'Order Placed': { label: 'Order Placed', color: 'bg-yellow-100 text-yellow-800' },
  'Order Confirmed': { label: 'Order Confirmed', color: 'bg-blue-100 text-blue-800' },
  'Packing': { label: 'Packing', color: 'bg-purple-100 text-purple-800' },
  'Out for Delivery': { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800' },
  'Delivered': { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  'Cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRider, setFilterRider] = useState('');
  const [error, setError] = useState('');
  const [statusModal, setStatusModal] = useState<{ open: boolean; orderId: string | null; current: string; initialStatus: string }>({ open: false, orderId: null, current: 'Order Placed', initialStatus: 'Order Placed' });
  const [assignModal, setAssignModal] = useState<{ open: boolean; orderId: string | null; riderId: string }>({ open: false, orderId: null, riderId: '' });
  const limit = 10;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
      if (filterStatus !== '') params.set('status', filterStatus);
      if (filterRider !== '') params.set('delivery_boy_id', filterRider);
      const res = await fetch(`/api/orders?${params}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'x-admin-request': 'true',
        },
      });
      if (res.status === 401) {
        setError('Session expired (401). Please log in again to access the orders panel.');
        return;
      }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setOrders(json.data || []);
      setTotalPages(json.meta?.totalPages || 1);
      setTotal(json.meta?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterRider]);

  const fetchDeliveryBoys = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery-boys?limit=100');
      const json = await res.json();
      setDeliveryBoys(json.data || []);
    } catch (_) { }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchDeliveryBoys();
  }, [fetchOrders, fetchDeliveryBoys]);

  const applyStatus = async (newStatus: string) => {
    if (!statusModal.orderId) return;
    const initial = statusModal.initialStatus || statusModal.current;
    const check = canTransitionStatus(initial, newStatus);
    if (!check.allowed) {
      alert(check.reason || `Status cannot move backwards from "${initial}" to "${newStatus}".`);
      return;
    }
    try {
      const legacyMap: Record<string, number> = { 'Order Placed': 0, 'Order Confirmed': 1, 'Packing': 2, 'Out for Delivery': 3, 'Delivered': 4, 'Cancelled': 5 };
      const res = await fetch(`/api/orders/${statusModal.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus, status: legacyMap[newStatus], isAdmin: true }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Update failed');
      }
      fetchOrders();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setStatusModal({ open: false, orderId: null, current: 'Order Placed', initialStatus: 'Order Placed' });
    }
  };

  const applyAssignRider = async (riderId: string) => {
    if (!assignModal.orderId) return;
    try {
      const res = await fetch(`/api/orders/${assignModal.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_boy_id: riderId || null, isAdmin: true }),
      });
      if (!res.ok) throw new Error('Failed to assign rider');
      fetchOrders();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAssignModal({ open: false, orderId: null, riderId: '' });
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'order_number',
      label: 'Order No.',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-gray-900 dark:text-gray-100 whitespace-nowrap">
          {row.order_number}
        </span>
      )
    },
    {
      key: 'customer_name' as any,
      label: 'Customer',
      render: (row: any) => {
        const rawName = row.customer_name || row.shippingAddress?.fullName || row.user_id?.name;
        const mobile = row.customer_mobile || row.shippingAddress?.phone || row.user_id?.mobile_no || row.user_id?.phone || '';
        const name = (rawName && typeof rawName === 'string' && rawName.trim()) ? rawName.trim() : (mobile ? 'Customer' : 'Guest');
        return (
          <div className="flex flex-col whitespace-nowrap">
            <span className="font-bold text-gray-900 dark:text-gray-100 text-xs">{name}</span>
            {mobile && <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">📞 {mobile}</span>}
          </div>
        );
      }
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (row) => <span className="font-bold text-gray-900 dark:text-gray-100 text-xs whitespace-nowrap">₹{(row.total_amount ?? 0).toFixed(2)}</span>
    },
    {
      key: 'payment_method',
      label: 'Payment',
      render: (row) => (
        <span className={clsx('px-2 py-0.5 text-[11px] font-bold rounded-full whitespace-nowrap',
          row.payment_method === 'COD' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
        )}>
          {row.payment_method}
        </span>
      )
    },
    {
      key: 'payment_status',
      label: 'Pay Status',
      render: (row) => (
        <span className={clsx('px-2 py-0.5 text-[11px] font-bold rounded-full whitespace-nowrap capitalize',
          row.payment_status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' :
          row.payment_status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300'
        )}>{row.payment_status}</span>
      )
    },
    {
      key: 'orderStatus' as keyof Order,
      label: 'Status',
      render: (row) => {
        const s = statusMap[row.orderStatus] ?? { label: row.orderStatus || 'Unknown', color: 'bg-gray-100 text-gray-800' };
        return <span className={clsx('px-2.5 py-0.5 text-[11px] font-bold rounded-full whitespace-nowrap inline-block', s.color)}>{s.label}</span>;
      }
    },
    {
      key: 'delivery_boy_id' as any,
      label: 'Delivery Boy',
      render: (row: any) => {
        const r = (typeof row.delivery_boy_id === 'object' && row.delivery_boy_id)
          || (row.items && row.items.find((it: any) => typeof it.delivery_boy_id === 'object' && it.delivery_boy_id)?.delivery_boy_id);
        const isDelivered = row.orderStatus === 'Delivered';
        const isOut = row.orderStatus === 'Out for Delivery';
        const isOnline = r?.is_active === '1';

        if (r?.name) {
          return (
            <div className="flex flex-col gap-0.5 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span className="font-bold text-gray-900 dark:text-white text-xs">{r.name}</span>
                {isDelivered ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 border border-green-200">
                    Delivered
                  </span>
                ) : isOut ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200">
                    Out for Delivery
                  </span>
                ) : (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${isOnline ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                )}
              </div>
              {r.mobile_number && (
                <a href={`tel:${r.mobile_number}`} className="text-[10px] text-gray-500 dark:text-gray-400 font-medium hover:text-green-600">
                  📞 {r.mobile_number}
                </a>
              )}
              {r.vehicle_number && (
                <span className="text-[9px] text-gray-400 font-medium">
                  🏍️ {r.vehicle_type || 'Vehicle'}: {r.vehicle_number}
                </span>
              )}
            </div>
          );
        }
        return (
          <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">
            {isDelivered ? 'Delivered (Direct)' : 'Unassigned'}
          </span>
        );
      }
    },
    {
      key: 'createdAt' as any,
      label: 'Order Date',
      render: (row: any) => {
        const rawDate = row.createdAt || row.created_at;
        if (!rawDate) return <span className="text-gray-400 text-xs whitespace-nowrap">-</span>;
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return <span className="text-gray-400 text-xs whitespace-nowrap">{String(rawDate)}</span>;
        return (
          <div className="flex flex-col whitespace-nowrap">
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
              {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </div>
        );
      }
    },
  ];

  const actions: Action<Order>[] = [
    {
      label: 'View',
      icon: <Eye size={15} />,
      onClick: (row) => window.open(`/admin/orders/${row._id}`, '_blank'),
      color: 'default'
    },
    {
      label: 'Assign Rider',
      icon: <Bike size={15} />,
      onClick: (row) => setAssignModal({ open: true, orderId: row._id, riderId: row.delivery_boy_id?._id || '' }),
      color: 'primary'
    },
    {
      label: 'Change Status',
      icon: <ArrowUpDown size={15} />,
      disabled: (row) => {
        const norm = normalizeOrderStatus(row.orderStatus);
        return norm === 'Delivered' || norm === 'Cancelled';
      },
      onClick: (row) => {
        const norm = normalizeOrderStatus(row.orderStatus || 'Order Placed');
        setStatusModal({ open: true, orderId: row._id, current: norm, initialStatus: norm });
      },
      color: 'success'
    },
    {
      label: 'Delete',
      icon: <Trash2 size={15} />,
      onClick: async (row) => {
        if (!confirm(`Are you sure you want to permanently delete order #${row.order_number}? This will delete it from database and customer's My Orders.`)) return;
        try {
          const res = await fetch(`/api/orders/${row._id}`, { method: 'DELETE' });
          const json = await res.json();
          if (!res.ok || !json.success) {
            alert(json.error || 'Failed to delete order.');
            return;
          }
          fetchOrders();
        } catch (err: any) {
          alert('Delete failed: ' + err.message);
        }
      },
      color: 'danger'
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      label: 'Delete Selected',
      icon: <Trash2 size={14} />,
      onClick: async (ids) => {
        if (!confirm(`Are you sure you want to permanently delete ${ids.length} selected orders? They will be removed from database and customer's My Orders.`)) return;
        try {
          const res = await fetch('/api/orders', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            alert(json.error || 'Failed to delete selected orders.');
          }
          fetchOrders();
        } catch (err: any) {
          alert('Bulk delete failed: ' + err.message);
        }
      },
      color: 'danger'
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/80 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Orders</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {total} Orders
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage customer orders, assign delivery riders, and track real-time delivery status.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center justify-between gap-3 flex-wrap shadow-2xs">
          <span className="font-semibold">⚠️ {error}</span>
          <div className="flex items-center gap-2">
            {(error.includes('401') || error.toLowerCase().includes('session')) && (
              <a
                href="/admin-login"
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                Log In to Admin
              </a>
            )}
            <button onClick={() => fetchOrders()} className="px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Clean Filters with Refresh Button */}
      <div className="flex flex-wrap gap-2.5 items-center justify-between">
        <div className="flex flex-wrap gap-2.5 items-center">
          <input
            type="text"
            placeholder="Search order no, mobile, customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 dark:text-white shadow-2xs placeholder-gray-400"
          />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-2xs cursor-pointer"
          >
            <option value="">All Status</option>
            {Object.entries(statusMap).map(([val, s]) => (
              <option key={val} value={val}>{s.label}</option>
            ))}
          </select>
          <select
            value={filterRider}
            onChange={(e) => { setFilterRider(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-2xs cursor-pointer max-w-[200px]"
          >
            <option value="">All Delivery Boys</option>
            {deliveryBoys.map((boy: any) => (
              <option key={boy._id} value={boy._id}>
                {boy.name} {boy.mobile_number ? `(${boy.mobile_number})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={() => fetchOrders()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-black transition-all duration-150 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
          title="Refresh orders to show newly ordered products"
        >
          <RotateCw size={14} className={loading ? "animate-spin text-emerald-600" : ""} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Orders Table with Integrated Real Pagination */}
      <DataTable
        data={orders}
        columns={columns}
        actions={actions}
        bulkActions={bulkActions}
        keyExtractor={(row) => row._id}
        loading={loading}
        hideToolbar={true}
        pagination={{
          page,
          totalPages,
          total,
          limit,
          onPageChange: setPage,
        }}
      />

      {/* Change Status Modal */}
      {statusModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-80">
            <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">Change Order Status</h3>
            <p className="text-xs text-gray-500 mb-3">
              Current: <span className="font-bold text-gray-800 dark:text-gray-200">{statusModal.initialStatus}</span>
            </p>
            <select
              value={statusModal.current}
              onChange={(e) => setStatusModal(m => ({ ...m, current: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {getAllowedNextStatuses(statusModal.initialStatus || statusModal.current)
                .filter(val => statusMap[val])
                .map((val) => (
                  <option key={val} value={val}>{statusMap[val]?.label || val}</option>
                ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setStatusModal({ open: false, orderId: null, current: 'Order Placed', initialStatus: 'Order Placed' })}
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

      {/* Assign Rider Modal */}
      {assignModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Bike className="text-green-600 w-5 h-5" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Assign Delivery Boy</h3>
            </div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select Rider</label>
            <select
              value={assignModal.riderId}
              onChange={(e) => setAssignModal(m => ({ ...m, riderId: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm mb-4 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Unassigned / Remove Rider</option>
              {deliveryBoys.map((boy: any) => (
                <option key={boy._id} value={boy._id}>
                  {boy.is_active === '1' ? ' Online' : ' Offline'} | {boy.name} ({boy.vehicle_type || 'Vehicle'} - {boy.mobile_number})
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setAssignModal({ open: false, orderId: null, riderId: '' })}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-bold text-gray-700 dark:text-gray-300"
              >Cancel</button>
              <button
                onClick={() => applyAssignRider(assignModal.riderId)}
                className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-sm"
              >Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
