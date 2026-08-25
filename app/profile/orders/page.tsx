'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingBag, Package, Truck, CheckCircle2, XCircle,
  ChevronRight, Clock, MapPin, CreditCard, Receipt,
  ArrowLeft, RefreshCw, Loader2, AlertCircle, Box,
  ClipboardList, ShieldCheck, LogOut,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  _id: string;
  product_name: string;
  qty: number;
  price: number;
  image?: string;
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

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['Order Placed'];
  const currentStep = cfg.step;
  const isCancelled = order.orderStatus === 'Cancelled';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes slideUp{from{transform:translateY(32px);opacity:0}to{transform:translateY(0);opacity:1}}
        .modal-slide{animation:slideUp .3s cubic-bezier(.22,1,.36,1) both}
      `}</style>

      <div className="modal-slide bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm rounded-t-3xl px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-black text-gray-950">Order Details</h2>
            <p className="text-xs font-bold text-gray-400">{order.order_number}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <XCircle className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${cfg.color} ${cfg.bg}`}>
            {cfg.icon}
            {cfg.label}
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
                      {/* Line */}
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

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Order Items */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Items Ordered</p>
            {order.populatedItems && order.populatedItems.length > 0 ? (
              <div className="space-y-3">
                {order.populatedItems.map((item) => (
                  <div key={item._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.product_name}
                        className="w-14 h-14 rounded-xl object-cover bg-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-primary/60" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-500 font-medium">Qty: {item.qty}</p>
                    </div>
                    <p className="text-sm font-black text-gray-900 flex-shrink-0">
                      ₹{(item.price * item.qty).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 font-medium">No item details available.</p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Order Info */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Info</p>

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
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Shipping to</p>
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{order.shippingAddress}</p>
                </div>
              </div>
            )}

            {order.estimated_delivery && (
              <div className="p-3 bg-green-50 rounded-2xl flex gap-2.5 border border-green-100">
                <Truck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-wide mb-0.5">Estimated Delivery</p>
                  <p className="text-sm font-bold text-green-800">{formatDate(order.estimated_delivery)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-gray-900">Order Total</span>
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

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
    >
      {/* Top stripe based on status */}
      <div className={`h-1 w-full ${
        order.orderStatus === 'Delivered' ? 'bg-green-400' :
        order.orderStatus === 'Cancelled' ? 'bg-red-400' :
        order.orderStatus === 'Out for Delivery' ? 'bg-orange-400' :
        'bg-primary'
      }`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-base font-black text-gray-950">{order.order_number}</p>
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
  const { data: session, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const FILTERS = ['All', 'Order Placed', 'Out for Delivery', 'Delivered', 'Cancelled'];

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders?limit=50', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load orders.');
      const json = await res.json();
      setOrders(json.data || []);
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleOrderClick = async (order: Order) => {
    setDetailLoading(true);
    setSelectedOrder(order); // show modal immediately with basic info
    try {
      const res = await fetch(`/api/orders/${order._id}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setSelectedOrder(json.data); // update with populated items
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = activeFilter === 'All'
    ? orders
    : orders.filter((o) => o.orderStatus === activeFilter);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ── Hero Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-950">My Orders</h1>
            <p className="text-xs text-gray-400 font-medium">{orders.length} total orders</p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
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
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === f
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Admin Session Notice */}
        {session?.user && (session.user as any).role === 'admin' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black">Logged in as Administrator ({session.user.name})</p>
                <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                  Showing system-wide orders. To test as a regular customer, log out and sign in with a customer account.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/admin/orders"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition"
              >
                Admin Panel
              </Link>
              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <LogOut size={13} /> Logout
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            </div>
            <p className="text-sm font-semibold text-gray-500">Loading your orders…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800">{error}</p>
              <button onClick={fetchOrders} className="text-xs text-primary font-bold mt-2 hover:underline">
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-gray-300" />
            </div>
            <div>
              <p className="text-lg font-black text-gray-800">
                {activeFilter === 'All' ? 'No orders yet' : `No ${activeFilter} orders`}
              </p>
              <p className="text-sm text-gray-400 font-medium mt-1">
                {activeFilter === 'All'
                  ? 'Your orders will appear here once you place one.'
                  : 'Try a different filter above.'}
              </p>
            </div>
            {activeFilter === 'All' && (
              <button
                onClick={() => router.push('/')}
                className="mt-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                Start Shopping
              </button>
            )}
          </div>
        )}

        {/* Order cards */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
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
          order={detailLoading ? selectedOrder : selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
