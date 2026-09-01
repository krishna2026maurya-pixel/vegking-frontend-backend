'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingBag, Package, Truck, CheckCircle2, XCircle,
  ChevronRight, Clock, MapPin, CreditCard, Receipt,
  ArrowLeft, RefreshCw, Loader2, AlertCircle, Box,
  ClipboardList, ShieldCheck, Scale, Sparkles, X, Store
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
    icon: <ClipboardList className="w-3.5 h-3.5" />,
    step: 0,
  },
  'Order Confirmed': {
    label: 'Confirmed',
    color: 'text-violet-600',
    bg: 'bg-violet-50 border-violet-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    step: 1,
  },
  'Packing': {
    label: 'Packing',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    icon: <Box className="w-3.5 h-3.5" />,
    step: 2,
  },
  'Out for Delivery': {
    label: 'Out for Delivery',
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    icon: <Truck className="w-3.5 h-3.5" />,
    step: 3,
  },
  'Delivered': {
    label: 'Delivered',
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    step: 4,
  },
  'Cancelled': {
    label: 'Cancelled',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    icon: <XCircle className="w-3.5 h-3.5" />,
    step: -1,
  },
};

const TRACK_STEPS = [
  { key: 'Order Placed', label: 'Placed', icon: ClipboardList },
  { key: 'Order Confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'Packing', label: 'Packing', icon: Box },
  { key: 'Out for Delivery', label: 'On Way', icon: Truck },
  { key: 'Delivered', label: 'Delivered', icon: CheckCircle2 },
];

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

// ─── Compact Order Detail Modal (Zero-Scroll Optimized) ───────────────────────
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['Order Placed'];
  const currentStep = cfg.step;
  const isCancelled = order.orderStatus === 'Cancelled';
  const hasBulk = isBulkOrder(order);
  const items = order.populatedItems || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-scaleUp max-h-[95vh] flex flex-col">
        
        {/* Compact Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <Package className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-sm font-black text-gray-950 truncate">{order.order_number}</h2>
                {hasBulk && (
                  <span className="bg-amber-400 text-gray-950 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                    🌾 Bulk Deal
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-medium">
                {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${cfg.color} ${cfg.bg}`}>
              {cfg.icon}
              <span>{cfg.label}</span>
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body (Compact Content Area) */}
        <div className="p-3.5 sm:p-4 space-y-3 overflow-y-auto max-h-[calc(95vh-60px)]">
          
          {/* Horizontal Progress Stepper Bar (Clean, Compact, No Scroll Needed) */}
          {!isCancelled ? (
            <div className="bg-gray-50/90 rounded-xl p-2.5 border border-gray-100">
              <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute left-4 right-4 top-3 h-0.5 bg-gray-200 z-0">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, (currentStep / (TRACK_STEPS.length - 1)) * 100))}%` }}
                  />
                </div>

                {TRACK_STEPS.map((step, idx) => {
                  const done = currentStep >= idx;
                  const active = currentStep === idx;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center flex-1 text-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shadow-xs ${
                        active
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 ring-offset-1 scale-110'
                          : done
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-400'
                      }`}>
                        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <StepIcon className="w-2.5 h-2.5" />}
                      </div>
                      <span className={`text-[9px] font-bold mt-1 tracking-tight truncate max-w-[54px] sm:max-w-none ${
                        active ? 'text-emerald-700 font-extrabold' : done ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>This order was cancelled.</span>
            </div>
          )}

          {/* Compact Items List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-gray-500 uppercase tracking-wider px-0.5">
              <span>Items ({items.length})</span>
              <span>Subtotal</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
              {items.map((item) => {
                const isItemBulk = item.is_bulk_deal || item.product_name?.includes('(Bulk Wholesale)');

                return (
                  <div
                    key={item._id}
                    className={`flex items-center justify-between gap-2 p-2 rounded-xl border text-xs ${
                      isItemBulk ? 'bg-emerald-50/50 border-emerald-200' : 'bg-gray-50/70 border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.product_name}
                          className="w-8 h-8 rounded-lg object-cover bg-white border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-100/60 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-emerald-700" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-extrabold text-gray-950 text-xs truncate">
                          {item.product_name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <span>{item.qty} {isItemBulk ? 'kg' : 'units'} @ ₹{item.price}</span>
                          {item.deal_token && (
                            <span className="font-mono font-bold text-amber-700 bg-amber-100/80 px-1 rounded text-[9px]">
                              {item.deal_token}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <strong className="font-black text-gray-900 shrink-0 text-xs sm:text-sm">
                      ₹{(item.price * item.qty).toFixed(2)}
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact Payment, Date & Delivery Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Payment Method</span>
              <div className="flex items-center justify-between">
                <strong className="font-black text-gray-900">{order.payment_method}</strong>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                  order.payment_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.payment_status}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Total Bill</span>
              <span className="text-sm sm:text-base font-black text-emerald-700">
                ₹{Number(order.total_amount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Shipping Address (Compact) */}
          {order.shippingAddress && (
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2 text-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">Deliver To:</span>
                <p className="text-gray-800 font-semibold text-[11px] leading-tight truncate">
                  {order.shippingAddress}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Compact Order Card (Clean, Tidy, Informative) ────────────────────────────
function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['Order Placed'];
  const hasBulk = isBulkOrder(order);
  const items = order.populatedItems || [];
  const firstItem = items[0];
  const moreCount = items.length > 1 ? items.length - 1 : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white border rounded-2xl shadow-2xs hover:shadow-sm hover:border-emerald-300 transition-all p-3 sm:p-3.5 flex flex-col justify-between gap-2.5 group cursor-pointer ${
        hasBulk ? 'border-emerald-200/80 bg-gradient-to-r from-emerald-50/20 to-white' : 'border-gray-150'
      }`}
    >
      {/* Top row: Order Number + Status */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-2 h-2 rounded-full ${
            order.orderStatus === 'Delivered' ? 'bg-green-500' :
            order.orderStatus === 'Cancelled' ? 'bg-red-500' :
            order.orderStatus === 'Out for Delivery' ? 'bg-orange-500' :
            'bg-emerald-500'
          }`} />
          <strong className="text-xs sm:text-sm font-black text-gray-950 truncate">{order.order_number}</strong>
          {hasBulk && (
            <span className="bg-amber-400 text-gray-950 text-[9px] font-black px-1.5 py-0.2 rounded uppercase shrink-0">
              🌾 Bulk Deal
            </span>
          )}
        </div>

        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${cfg.color} ${cfg.bg}`}>
          {cfg.icon}
          <span>{cfg.label}</span>
        </span>
      </div>

      {/* Middle row: Items preview & Date */}
      <div className="flex items-center justify-between gap-2 text-xs text-gray-500 w-full">
        <div className="flex items-center gap-2 min-w-0">
          {firstItem?.image ? (
            <img
              src={firstItem.image}
              alt={firstItem.product_name}
              className="w-7 h-7 rounded-lg object-cover bg-gray-100 border border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Package className="w-3.5 h-3.5 text-gray-400" />
            </div>
          )}
          <span className="truncate font-semibold text-gray-800 text-xs">
            {firstItem?.product_name || 'Produce Order'}
            {moreCount > 0 && <span className="text-gray-400 text-[11px] font-normal"> +{moreCount} more</span>}
          </span>
        </div>

        <span className="text-[11px] text-gray-400 shrink-0 font-medium">
          {formatDate(order.createdAt)}
        </span>
      </div>

      {/* Bottom row: Total amount & View details arrow */}
      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 w-full text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-gray-400">Total:</span>
          <strong className="text-xs sm:text-sm font-black text-emerald-800">
            ₹{Number(order.total_amount || 0).toFixed(2)}
          </strong>
          <span className="text-[10px] text-gray-400">({order.payment_method})</span>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 group-hover:text-emerald-800">
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </button>
  );
}

// ─── Main My Orders Page ──────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const router = useRouter();
  const { data: session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const FILTERS = [
    'All',
    '🌾 Bulk Deals',
    '🛍️ Retail',
    'Order Placed',
    'Packing',
    'Out for Delivery',
    'Delivered',
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

  const filtered = orders.filter((o) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === '🌾 Bulk Deals') return isBulkOrder(o);
    if (activeFilter === '🛍️ Retail') return !isBulkOrder(o);
    return o.orderStatus === activeFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50/70 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200/80 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/profile"
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-black text-gray-950 leading-tight">My Orders</h1>
              <p className="text-[11px] text-gray-500 font-medium">
                {orders.length} total orders &bull; {orders.filter(isBulkOrder).length} bulk wholesale deals
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchOrders(false)}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Compact Filter Pills */}
        <div className="max-w-3xl mx-auto px-3 sm:px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === f
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Container */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-3.5 border border-gray-100 animate-pulse flex flex-col gap-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="font-bold text-gray-900 text-sm">{error}</h3>
            <button
              onClick={() => fetchOrders(false)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6 space-y-2.5">
            <Package className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-900 text-sm">No orders found</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              {activeFilter !== 'All'
                ? `No orders matching "${activeFilter}".`
                : "You haven't placed any orders yet."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs mt-1"
            >
              <span>Explore Fresh Produce</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onClick={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Zero-Scroll Optimized Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
