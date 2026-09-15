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
  Trash2,
  Bike,
  Phone,
  CheckCircle2,
  Copy,
  Check,
  RotateCw,
} from 'lucide-react';
import clsx from 'clsx';
import { getAllowedNextStatuses, canTransitionStatus, normalizeOrderStatus } from '@/lib/order-status-rules';

const statusMap: Record<string, { label: string; color: string }> = {
  'Order Placed': { label: 'Order Placed', color: 'bg-yellow-100 text-yellow-800' },
  'Order Confirmed': { label: 'Order Confirmed', color: 'bg-blue-100 text-blue-800' },
  'Packing': { label: 'Packing', color: 'bg-purple-100 text-purple-800' },
  'Out for Delivery': { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800' },
  'Delivered': { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  'Cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

export default function AdminOrderDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignRiderId, setAssignRiderId] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);

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

  const fetchDeliveryBoys = async () => {
    try {
      const res = await fetch('/api/delivery-boys?limit=100');
      const json = await res.json();
      setDeliveryBoys(json.data || []);
    } catch (_) { }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
      fetchDeliveryBoys();
    }
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!selectedStatus || selectedStatus === order?.orderStatus) return;
    const normCurrent = normalizeOrderStatus(order?.orderStatus);
    const normNext = normalizeOrderStatus(selectedStatus);
    const check = canTransitionStatus(normCurrent, normNext);
    if (!check.allowed) {
      alert(check.reason || `Status cannot move backwards from "${normCurrent}" to "${normNext}".`);
      return;
    }
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

  const handleAssignRider = async (riderId: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_boy_id: riderId || null,
          isAdmin: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to assign delivery boy');
      alert(riderId ? 'Delivery boy assigned successfully' : 'Delivery boy removed');
      setAssignModalOpen(false);
      fetchOrder();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    const orderNum = order?.order_number || id;
    if (!confirm(`Are you sure you want to permanently delete order #${orderNum}? This will delete it from the database and the customer's My Orders section.`)) {
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order?._id || id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete order.');
      }
      alert(`Order #${orderNum} deleted successfully.`);
      router.push('/admin/orders');
    } catch (err: any) {
      alert(err.message || 'Failed to delete order.');
      setUpdating(false);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
      </div>
    );
  }

  const items = order.populatedItems || order.items || [];
  const currentStatusObj = statusMap[order.orderStatus] || { label: order.orderStatus || 'Order Placed', color: 'bg-gray-100 text-gray-800' };

  // Delivery Boy resolution (order level or item level)
  const deliveryBoy = (typeof order.delivery_boy_id === 'object' && order.delivery_boy_id)
    || (items.find((it: any) => typeof it.delivery_boy_id === 'object' && it.delivery_boy_id)?.delivery_boy_id)
    || null;

  const isDelivered = order.orderStatus === 'Delivered';
  const isOut = order.orderStatus === 'Out for Delivery';
  const deliveredHistory = Array.isArray(order.statusHistory)
    ? order.statusHistory.find((h: any) => h.status === 'Delivered')
    : null;
  const outHistory = Array.isArray(order.statusHistory)
    ? order.statusHistory.find((h: any) => h.status === 'Out for Delivery')
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/orders')}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition cursor-pointer"
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
        <div className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-2xl shadow-xs self-start sm:self-auto flex-wrap">
          {(() => {
            const normCurrent = normalizeOrderStatus(order.orderStatus);
            const isTerminal = normCurrent === 'Delivered' || normCurrent === 'Cancelled';
            const allowedList = getAllowedNextStatuses(normCurrent);

            return (
              <>
                <select
                  value={selectedStatus}
                  disabled={isTerminal || updating}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs font-bold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {allowedList.map((val) => (
                    <option key={val} value={val}>{statusMap[val]?.label || val}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={updating || isTerminal || selectedStatus === order.orderStatus}
                  onClick={handleUpdateStatus}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {updating ? 'Updating...' : isTerminal ? 'Completed' : 'Update Status'}
                </button>
              </>
            );
          })()}

          <button
            type="button"
            disabled={updating}
            onClick={handleDeleteOrder}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Permanently delete this order"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Order</span>
          </button>
        </div>
      </div>

      {/* Grid: Details & Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Order Items & Status History */}
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
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
                          <img src={img} alt={title} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{title}</h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {itemUnit && `${itemUnit} • `}Qty: {itemQty} × ₹{itemPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-bold text-xs sm:text-sm text-gray-900 shrink-0">
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

          {/* Timeline / Status History with Delivery Boy details */}
          {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <h2 className="text-sm font-bold text-gray-900">Status History</h2>
                </div>
                {deliveryBoy && (
                  <span className="text-[11px] text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                    <Bike className="w-3 h-3 text-green-600" />
                    <span>Rider: {deliveryBoy.name}</span>
                  </span>
                )}
              </div>
              <div className="space-y-4 pt-1">
                {order.statusHistory.map((h: any, i: number) => {
                  const isHistoryDelivered = h.status === 'Delivered';
                  const isHistoryOut = h.status === 'Out for Delivery';

                  return (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${isHistoryDelivered ? 'bg-green-600 ring-4 ring-green-100' :
                        isHistoryOut ? 'bg-indigo-600 ring-4 ring-indigo-100' :
                          'bg-emerald-500'
                        }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 text-xs sm:text-sm">{h.status}</span>
                          {h.updatedBy && (
                            <span className="text-[10px] text-gray-400 font-medium">
                              (by {h.updatedBy === 'Admin' ? 'Admin' : (deliveryBoy?.name || h.updatedBy)})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {h.updatedAt ? new Date(h.updatedAt).toLocaleString('en-IN') : 'Just now'}
                        </p>

                        {/* Delivery Boy note for Delivered status in history */}
                        {/* {isHistoryDelivered && deliveryBoy && (
                          <div className="mt-2 flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-xs">
                            <div className="w-7 h-7 rounded-lg bg-green-200 text-green-800 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-green-700" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-black text-green-800 uppercase tracking-wider block">
                                Delivered By Delivery Boy
                              </span>
                              <p className="font-bold text-gray-900 text-xs truncate">
                                {deliveryBoy.name} {deliveryBoy.mobile_number ? `• 📞 ${deliveryBoy.mobile_number}` : ''}
                              </p>
                              {deliveryBoy.vehicle_number && (
                                <p className="text-[10px] text-gray-500">
                                  {deliveryBoy.vehicle_type || 'Vehicle'}: {deliveryBoy.vehicle_number}
                                </p>
                              )}
                            </div>
                          </div>
                        )} */}

                        {/* Delivery Boy note for Out for Delivery status in history */}
                        {/* {isHistoryOut && deliveryBoy && (
                          <div className="mt-2 flex items-center gap-2.5 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs">
                            <div className="w-7 h-7 rounded-lg bg-indigo-200 text-indigo-800 flex items-center justify-center shrink-0">
                              <Truck className="w-4 h-4 text-indigo-700" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider block">
                                Dispatched With Delivery Boy
                              </span>
                              <p className="font-bold text-gray-900 text-xs truncate">
                                {deliveryBoy.name} {deliveryBoy.mobile_number ? `• 📞 ${deliveryBoy.mobile_number}` : ''}
                              </p>
                              {deliveryBoy.vehicle_number && (
                                <p className="text-[10px] text-gray-500">
                                  {deliveryBoy.vehicle_type || 'Vehicle'}: {deliveryBoy.vehicle_number}
                                </p>
                              )}
                            </div>
                          </div>
                        )} */}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Customer & Delivery, Delivery Boy Card, Payment Summary */}
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

              {/* Delivery Boy summary row inside Customer & Delivery */}
              <div className="border-t border-gray-100 pt-2.5">
                <span className="text-[11px] text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Bike className="w-3 h-3 text-green-600" /> Delivery Partner
                </span>
                {deliveryBoy ? (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{deliveryBoy.name}</p>
                      <p className="text-gray-500 text-[11px] truncate">
                        📞 {deliveryBoy.mobile_number || 'No phone'}
                        {deliveryBoy.vehicle_number ? ` • ${deliveryBoy.vehicle_number}` : ''}
                      </p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${isDelivered ? 'bg-green-100 text-green-800 border border-green-200' :
                      isOut ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                      {isDelivered ? 'Delivered' : isOut ? 'Out for Delivery' : 'Assigned'}
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-400 text-xs mt-0.5">No delivery boy assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <CreditCard className="w-4 h-4 text-green-600" />
              <h2 className="text-sm font-bold text-gray-900">Payment &amp; Pricing</h2>
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
              {((order.coupon_discount || order.discount || 0) > 0 || order.coupon_code) && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>🏷️ Coupon Discount {order.coupon_code ? `(${order.coupon_code})` : ''}:</span>
                  <span>-₹{Number(order.coupon_discount || order.discount || 0).toFixed(2)}</span>
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

      {/* Assign Rider Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-100 space-y-4">
            <div className="flex items-center gap-2">
              <Bike className="text-green-600 w-5 h-5" />
              <h3 className="text-base font-black text-gray-900">Assign Delivery Boy</h3>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Choose Delivery Partner
              </label>
              <select
                value={assignRiderId}
                onChange={(e) => setAssignRiderId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-semibold bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Unassigned / Remove Rider</option>
                {deliveryBoys.map((boy: any) => (
                  <option key={boy._id} value={boy._id}>
                    {boy.is_active === '1' ? '🟢 Online' : '⚪ Offline'} | {boy.name} ({boy.vehicle_type || 'Vehicle'} - {boy.mobile_number})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="flex-1 py-2 text-xs font-bold border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleAssignRider(assignRiderId)}
                className="flex-1 py-2 text-xs font-black bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {updating ? 'Assigning...' : 'Save Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

