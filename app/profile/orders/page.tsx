'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingBag, Package, Truck, CheckCircle2, XCircle,
  ChevronRight, Clock, MapPin, CreditCard, Receipt,
  ArrowLeft, RefreshCw, Loader2, AlertCircle, Box,
  ClipboardList, ShieldCheck, LogOut, Scale, Sparkles
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  _id: string;
  product_name: string;
  qty: number;
  price: number;
  image?: string;
  is_bulk_deal?: boolean;
  deal_token?: string;
  negotiation_id?: string;
}

interface Order {
  _id: string;
  order_number: string;
  orderStatus: string;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  shippingAddress: string;
  createdAt: string;
  estimated_delivery?: string;
  populatedItems?: OrderItem[];
  items?: any[];
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  step: number;
}> = {
  'Order Placed': {
    label: 'Order Placed',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    icon: <ClipboardList className="w-4 h-4" />,
    step: 0,
  },
  'Order Confirmed': {
    label: 'Confirmed',
    color: 'text-violet-600',
    bg: 'bg-violet-50 border-violet-200',
    icon: <CheckCircle2 className="w-4 h-4" />,
    step: 1,
  },
  'Packing': {
    label: 'Packing',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    icon: <Box className="w-4 h-4" />,
    step: 2,
  },
  'Out for Delivery': {
    label: 'Out for Delivery',
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    icon: <Truck className="w-4 h-4" />,
    step: 3,
  },
  'Delivered': {
    label: 'Delivered',
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    icon: <CheckCircle2 className="w-4 h-4" />,
    step: 4,
  },
  'Cancelled': {
    label: 'Cancelled',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    icon: <XCircle className="w-4 h-4" />,
    step: -1,
  },
};

const TRACK_STEPS = ['Order Placed', 'Order Confirmed', 'Packing', 'Out for Delivery', 'Delivered'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });
}

function isBulkOrder(order: Order): boolean {
  if (order.populatedItems && order.populatedItems.length > 0) {
    return order.populatedItems.some((i) => i.is_bulk_deal || i.product_name?.includes('(Bulk Wholesale)'));
  }
  return false;
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['Order Placed'];
  const currentStep = cfg.step;
  const isCancelled = order.orderStatus === 'Cancelled';
  const hasBulk = isBulkOrder(order);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm rounded-t-3xl px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-950">Order Details</h2>
              {hasBulk && (
                <span className="bg-amber-400 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  🌾 Bulk Wholesale
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-gray-400">{order.order_number}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${cfg.color} ${cfg.bg}`}>
              {cfg.icon}
              {cfg.label}
            </div>

            <span className="text-xs font-bold text-gray-500">
              Placed {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </span>
          </div>

          {/* Tracking Steps */}
          {!isCancelled && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Tracking</p>
              <div className="relative">
                {TRACK_STEPS.map((step, idx) => {
                  const done = currentStep >= idx;
                  const active = currentStep === idx;
                  return (
                    <div key={step} className="flex items-start gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          done
                            ? 'bg-primary border-primary text-white'
                            : 'bg-white border-gray-200 text-gray-400'
                        } ${active ? 'ring-4 ring-primary/20' : ''}`}>
                          {done
                            ? <CheckCircle2 className="w-4 h-4" />
                            : <div className="w-2 h-2 rounded-full bg-gray-300" />
                          }
                        </div>
                        {idx < TRACK_STEPS.length - 1 && (
                          <div className={`w-0.5 h-8 mt-1 rounded-full transition-all ${done ? 'bg-primary/40' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <div className="pt-1.5">
                        <p className={`text-sm font-bold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step}</p>
                        {active && (
                          <p className="text-xs text-primary font-semibold mt-0.5">Current status</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="h-px bg-gray-100" />

          {/* Order Items */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Items in this Order</p>
            {order.populatedItems && order.populatedItems.length > 0 ? (
              <div className="space-y-3">
                {order.populatedItems.map((item) => {
                  const isItemBulk = item.is_bulk_deal || item.product_name?.includes('(Bulk Wholesale)');

                  return (
                    <div
                      key={item._id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border ${
                        isItemBulk
                          ? 'bg-gradient-to-r from-emerald-50/70 to-white border-emerald-200'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.product_name}
                          className="w-14 h-14 rounded-xl object-cover bg-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="w-6 h-6 text-primary/60" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isItemBulk && (
                            <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                              Bulk Deal
                            </span>
                          )}
                          <p className="text-sm font-bold text-gray-900 truncate">{item.product_name}</p>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          Qty: <strong className="text-gray-800 font-bold">{item.qty} {isItemBulk ? 'kg' : ''}</strong> &bull; Rate: ₹{item.price}/{isItemBulk ? 'kg' : 'unit'}
                        </p>
                        {item.deal_token && (
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">Token: {item.deal_token}</p>
                        )}
                      </div>
                      <p className="text-sm font-black text-gray-900 shrink-0">
                        ₹{(item.price * item.qty).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 font-medium">No item details available.</p>
            )}
          </div>

          <div className="h-px bg-gray-100" />

          {/* Order Info */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment & Delivery</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Payment</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{order.payment_method}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                  order.payment_status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : order.payment_status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {order.payment_status}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Placed on</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatDate(order.createdAt)}</p>
                <p className="text-xs text-gray-500 font-medium">{formatTime(order.createdAt)}</p>
              </div>
            </div>

            {order.shippingAddress && (
              <div className="p-3 bg-gray-50 rounded-2xl flex gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Shipping to</p>
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{order.shippingAddress}</p>
                </div>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-gray-900">Total Paid</span>
            </div>
            <span className="text-xl font-black text-primary">₹{Number(order.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['Order Placed'];
  const hasBulk = isBulkOrder(order);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white border rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group cursor-pointer ${
        hasBulk ? 'border-emerald-200' : 'border-gray-100'
      }`}
    >
      {/* Top stripe based on type/status */}
      <div className={`h-1.5 w-full ${
        hasBulk ? 'bg-gradient-to-r from-emerald-500 to-amber-400' :
        order.orderStatus === 'Delivered' ? 'bg-green-400' :
        order.orderStatus === 'Cancelled' ? 'bg-red-400' :
        order.orderStatus === 'Out for Delivery' ? 'bg-orange-400' :
        'bg-primary'
      }`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-black text-gray-950">{order.order_number}</p>
              {hasBulk && (
                <span className="inline-flex items-center gap-1 bg-amber-400 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  🌾 Bulk Deal
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.color} ${cfg.bg}`}>
              {cfg.icon}
              {cfg.label}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{order.payment_method}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className={`font-bold ${
              order.payment_status === 'completed' ? 'text-green-600' :
              order.payment_status === 'failed' ? 'text-red-600' : 'text-amber-600'
            }`}>
              {order.payment_status}
            </span>
          </div>
          <p className="text-lg font-black text-gray-950">₹{Number(order.total_amount || 0).toFixed(2)}</p>
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const router = useRouter();
  const { data: session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const FILTERS = [
    'All Orders',
    '🌾 Bulk Wholesale Orders',
    '🛍️ Retail Orders',
    'Order Placed',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
  ];

  const fetchOrders = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders?limit=50', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load orders.');
      const json = await res.json();
      const orderList = json.data || [];
      setOrders(orderList);

      // Keep open modal synced with latest status in real time
      setSelectedOrder((prev) => {
        if (!prev) return null;
        const matching = orderList.find((o: any) => o._id === prev._id);
        return matching ? { ...prev, ...matching } : prev;
      });
    } catch (e: any) {
      if (isInitial) setError(e.message || 'Something went wrong.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchOrders(true);
    const timer = setInterval(() => {
      fetchOrders(false);
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  const handleOrderClick = async (order: Order) => {
    setDetailLoading(true);
    setSelectedOrder(order);
    try {
      const res = await fetch(`/api/orders/${order._id}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setSelectedOrder(json.data);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = orders.filter((o) => {
    if (activeFilter === 'All Orders' || activeFilter === 'All') return true;
    if (activeFilter === '🌾 Bulk Wholesale Orders') return isBulkOrder(o);
    if (activeFilter === '🛍️ Retail Orders') return !isBulkOrder(o);
    return o.orderStatus === activeFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ── Hero Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-950">My Orders</h1>
            <p className="text-xs text-gray-400 font-medium">
              {orders.length} total orders &bull; {orders.filter(isBulkOrder).length} bulk wholesale deals
            </p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === f
                  ? 'bg-green-600 text-white shadow-sm shadow-green-600/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-100 rounded w-20" />
                  </div>
                  <div className="h-7 bg-gray-100 rounded-full w-24" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-48" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h3 className="font-bold text-gray-900 text-base">{error}</h3>
            <button
              onClick={fetchOrders}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition"
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 space-y-3">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-900 text-base">No orders found</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              {activeFilter !== 'All Orders' && activeFilter !== 'All'
                ? `No orders matching filter "${activeFilter}".`
                : "You haven't placed any orders yet."}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Link
                href="/products"
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition"
              >
                Start Shopping
              </Link>
              <Link
                href="/bulk-products"
                className="px-5 py-2.5 bg-amber-400 text-gray-950 rounded-xl text-xs font-black hover:bg-amber-500 transition"
              >
                🌾 Bulk Deals (5kg+)
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onClick={() => handleOrderClick(order)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
