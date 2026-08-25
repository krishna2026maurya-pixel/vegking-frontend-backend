'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import clsx from 'clsx';

const statusMap: Record<string, { label: string; color: string }> = {
  'Order Placed':     { label: 'Order Placed',     color: 'bg-yellow-100 text-yellow-800' },
  'Order Confirmed':  { label: 'Order Confirmed',  color: 'bg-blue-100 text-blue-800' },
  'Packing':          { label: 'Packing',          color: 'bg-purple-100 text-purple-800' },
  'Out for Delivery': { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800' },
  'Delivered':        { label: 'Delivered',        color: 'bg-green-100 text-green-800' },
  'Cancelled':        { label: 'Cancelled',        color: 'bg-red-100 text-red-800' },
};

export default function AdminOrderDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error('Order not found');
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || 'Failed to load order');
      setOrder(json.data);
      setSelectedStatus(json.data.orderStatus || 'Order Placed');
    } catch (e: any) {
      setError(e.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!selectedStatus || selectedStatus === order?.orderStatus) return;
    setUpdating(true);
    try {
      const legacyMap: Record<string, number> = {
        'Order Placed': 0,
        'Order Confirmed': 1,
        'Packing': 2,
        'Out for Delivery': 3,
        'Delivered': 4,
        'Cancelled': 5,
      };

      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStatus: selectedStatus,
          status: legacyMap[selectedStatus] ?? 0,
          isAdmin: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Status update failed');
      alert(`Order status updated to "${selectedStatus}"`);
      fetchOrder();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-9 h-9 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">{error || 'Order not found'}</h2>
        <button
          onClick={() => router.push('/admin/orders')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
      </div>
    );
  }

  const items = order.populatedItems || order.items || [];
  const currentStatusObj = statusMap[order.orderStatus] || { label: order.orderStatus || 'Order Placed', color: 'bg-gray-100 text-gray-800' };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/orders')}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition"
            title="Back to Orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Order #{order.order_number || order._id}
              </h1>
              <span className={clsx('px-2.5 py-0.5 text-xs font-bold rounded-full', currentStatusObj.color)}>
                {currentStatusObj.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : 'N/A'}
            </p>
          </div>
        </div>

        {/* Change Status Control on Detail Page */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-2xl shadow-xs self-start sm:self-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-bold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 outline-none cursor-pointer"
          >
            {Object.entries(statusMap).map(([val, s]) => (
              <option key={val} value={val}>{s.label}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={updating || selectedStatus === order.orderStatus}
            onClick={handleUpdateStatus}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>

      {/* Grid: Details & Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-green-600" />
                <h2 className="text-sm font-bold text-gray-900">Order Items ({items.length})</h2>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {items.length > 0 ? (
                items.map((item: any, idx: number) => {
                  const img = item.product_image || item.image || '/images/product-card-default.jpg';
                  const title = item.product_name || item.name || 'Product';
                  const itemPrice = Number(item.price || item.selling_price || 0);
                  const itemQty = Number(item.quantity || item.qty || 1);
                  const itemUnit = item.unit || item.quantity_unit || '';
                  return (
                    <div key={item._id || idx} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
                          <img src={img} alt={title} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900">{title}</h4>
                          <p className="text-[11px] text-gray-400">
                            {itemUnit && `${itemUnit} • `}Qty: {itemQty} × ₹{itemPrice}
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-bold text-xs sm:text-sm text-gray-900">
                        ₹{(itemPrice * itemQty).toFixed(2)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-gray-400 py-4 text-center">No item records found</div>
              )}
            </div>
          </div>

          {/* Timeline / Status History */}
          {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Clock className="w-4 h-4 text-green-600" />
                <h2 className="text-sm font-bold text-gray-900">Status History</h2>
              </div>
              <div className="space-y-3 pt-1">
                {order.statusHistory.map((h: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-bold text-gray-800">{h.status}</span>
                      <p className="text-[11px] text-gray-400">
                        {h.updatedAt ? new Date(h.updatedAt).toLocaleString('en-IN') : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Customer, Delivery & Payment Summary */}
        <div className="space-y-6">
          {/* Customer & Address */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <User className="w-4 h-4 text-green-600" />
              <h2 className="text-sm font-bold text-gray-900">Customer & Delivery</h2>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Contact</span>
                <p className="font-bold text-gray-900 mt-0.5">{order.customer_name || 'Customer'}</p>
                <p className="text-gray-600">{order.customer_mobile || order.user_id?.phone || 'No phone'}</p>
                {order.user_id?.email && <p className="text-gray-500">{order.user_id.email}</p>}
              </div>

              <div className="border-t border-gray-100 pt-2.5">
                <span className="text-[11px] text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-green-600" /> Delivery Address
                </span>
                <p className="font-semibold text-gray-800 mt-1 leading-relaxed">
                  {order.delivery_address?.address_line1 || order.delivery_address?.address || order.shipping_address || 'Address on file'}
                </p>
                {(order.delivery_address?.city || order.delivery_address?.pincode) && (
                  <p className="text-gray-500 mt-0.5">
                    {[order.delivery_address?.city, order.delivery_address?.state, order.delivery_address?.pincode].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <CreditCard className="w-4 h-4 text-green-600" />
              <h2 className="text-sm font-bold text-gray-900">Payment & Pricing</h2>
            </div>

            <div className="space-y-2 text-gray-600">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold text-gray-900 uppercase">{order.payment_method || 'COD'}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className={clsx('font-bold capitalize', order.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600')}>
                  {order.payment_status || 'Pending'}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span>Subtotal:</span>
                <span>₹{(order.subtotal || order.total_amount || 0).toFixed(2)}</span>
              </div>
              {order.delivery_charge > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span>₹{Number(order.delivery_charge).toFixed(2)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-₹{Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between font-black text-sm text-gray-900">
                <span>Total Amount:</span>
                <span className="text-green-700">₹{Number(order.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
