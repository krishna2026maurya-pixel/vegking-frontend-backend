'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingBag, Package, Truck, CheckCircle2, XCircle,
  ChevronRight, Clock, MapPin, CreditCard, Receipt,
  ArrowLeft, RefreshCw, Loader2, AlertCircle, Box,
  ClipboardList, ShieldCheck, Scale, Sparkles, X, Store,
  PhoneCall, Bike, Copy, Check, HelpCircle
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RiderInfo {
  _id?: string;
  name?: string;
  full_name?: string;
  phone?: string;
  mobile?: string;
  mobile_no?: string;
  mobile_number?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  profile_image?: string;
  is_active?: string | number;
}

interface OrderItem {
  _id: string;
  product_name: string;
  qty: number;
  price: number;
  image?: string;
  is_bulk_deal?: boolean;
  deal_token?: string;
  negotiation_id?: string;
  delivery_boy_id?: RiderInfo | null;
}

interface Order {
  _id: string;
  order_number: string;
  orderStatus: string;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  delivery_charge?: number;
  shippingAddress: string;
  createdAt: string;
  updatedAt?: string;
  statusHistory?: { status: string; updatedAt: string }[];
  estimated_delivery?: string;
  delivery_boy_id?: RiderInfo | null;
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

// ─── Compact Vertical Order Detail Modal ──────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['Order Placed'];
  const currentStep = cfg.step;
  const isCancelled = order.orderStatus === 'Cancelled';
  const hasBulk = isBulkOrder(order);
  const items = (order.populatedItems && order.populatedItems.length > 0)
    ? order.populatedItems
    : (order.items || []);

  const itemsSubtotal = items.reduce(
    (acc: number, item: any) => acc + (Number(item.price || 0) * Number(item.qty || item.quantity || 1)),
    0
  );

  // Delivery charge calculation:
  // Free delivery if items subtotal is >= 199; otherwise standard ₹40 delivery charge
  const isFreeDelivery = itemsSubtotal >= 199 || Number(order.total_amount || 0) >= 199 || order.delivery_charge === 0;
  const deliveryCharge = order.delivery_charge !== undefined && order.delivery_charge !== null
    ? Number(order.delivery_charge)
    : (order.total_amount && itemsSubtotal > 0 && order.total_amount > itemsSubtotal)
    ? Math.max(0, Math.round((order.total_amount - itemsSubtotal) * 100) / 100)
    : (itemsSubtotal > 0 && itemsSubtotal < 199 ? 40 : 0);

  const calculatedTotal = itemsSubtotal > 0 ? (itemsSubtotal + (isFreeDelivery ? 0 : deliveryCharge)) : (order.total_amount || 0);

  // Single rider information for the order
  const anyRider = order.delivery_boy_id || items.find((it) => it.delivery_boy_id)?.delivery_boy_id;
  const riderName = typeof anyRider === 'object' ? (anyRider?.name || anyRider?.full_name) : undefined;
  const riderPhone = typeof anyRider === 'object' 
    ? (anyRider?.mobile || anyRider?.phone || anyRider?.mobile_number || anyRider?.mobile_no) 
    : undefined;
  const riderVehicle = typeof anyRider === 'object' ? anyRider?.vehicle_type : undefined;
  const riderVehicleNo = typeof anyRider === 'object' ? anyRider?.vehicle_number : undefined;

  const outForDeliveryStep = order.statusHistory?.find((s: any) => s.status === 'Out for Delivery');
  const assignedTime = outForDeliveryStep?.updatedAt 
    ? `${formatDate(outForDeliveryStep.updatedAt)} at ${formatTime(outForDeliveryStep.updatedAt)}`
    : order.updatedAt 
    ? `${formatDate(order.updatedAt)} at ${formatTime(order.updatedAt)}`
    : `${formatDate(order.createdAt)} at ${formatTime(order.createdAt)}`;

  const isOutForDelivery = order.orderStatus === 'Out for Delivery' || order.orderStatus === 'Delivered';

  const handleCopyOrderId = () => {
    if (order.order_number) {
      navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Horizontal Page-Style Modal Container */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl lg:max-w-5xl overflow-hidden border border-gray-150 animate-scaleUp my-auto sm:my-6 flex flex-col shrink-0">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-50/50 via-white to-gray-50/50 border-b border-gray-150 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-gray-950 tracking-tight">{order.order_number}</h2>
                <button
                  onClick={handleCopyOrderId}
                  className="p-1 rounded-md text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                  title="Copy Order ID"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-extrabold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                {hasBulk && (
                  <span className="bg-amber-400 text-gray-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-2xs">
                    🌾 Wholesale Deal
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                Ordered on {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-2xs ${cfg.color} ${cfg.bg}`}>
              {cfg.icon}
              <span>{cfg.label}</span>
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0 cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 max-h-[calc(90vh-75px)]">
          
          {/* Top Live Order Status Hero Banner (Like Blinkit/Swiggy/Amazon) */}
          {!isCancelled ? (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  {order.orderStatus === 'Out for Delivery' && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    {order.orderStatus === 'Out for Delivery' ? (
                      <Truck className="w-5 h-5 animate-pulse" />
                    ) : order.orderStatus === 'Delivered' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-gray-950">
                    {order.orderStatus === 'Out for Delivery'
                      ? 'Out for Delivery — On the Way!'
                      : order.orderStatus === 'Delivered'
                      ? 'Order Delivered Successfully'
                      : order.orderStatus === 'Packing'
                      ? 'Packaging Fresh Produce at Warehouse'
                      : order.orderStatus === 'Order Confirmed'
                      ? 'Order Confirmed & Preparing for Dispatch'
                      : 'Order Placed — Processing Your Fresh Veggies'}
                  </h3>
                  <p className="text-xs text-gray-600 font-medium mt-0.5 leading-snug">
                    {order.orderStatus === 'Out for Delivery'
                      ? 'Your delivery partner has picked up your produce and is on the way.'
                      : order.orderStatus === 'Delivered'
                      ? 'Enjoy your farm fresh produce. Rate your experience anytime.'
                      : 'Quality inspected farm produce packed with care.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <span className="text-xs font-black text-emerald-800 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{order.orderStatus === 'Delivered' ? 'Completed' : 'Expected Today'}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-2.5">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <strong className="block text-sm">Order Cancelled</strong>
                <span className="text-gray-600 font-normal">This order has been cancelled and is no longer being processed.</span>
              </div>
            </div>
          )}

          {/* Stepper Tracker Card */}
          {!isCancelled && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-150 shadow-2xs">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Order Delivery Tracking
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Step {Math.max(1, currentStep + 1)} of {TRACK_STEPS.length} ({cfg.label})
                </span>
              </div>

              <div className="relative pt-1 pb-1">
                <div className="absolute top-[16px] left-[10%] right-[10%] h-1.5 bg-gray-100 rounded-full -z-0">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700 shadow-xs"
                    style={{
                      width: `${Math.min(100, Math.max(0, (currentStep / (TRACK_STEPS.length - 1)) * 100))}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-5 gap-1 relative z-10">
                  {TRACK_STEPS.map((step, idx) => {
                    const done = currentStep >= idx;
                    const active = currentStep === idx;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs shrink-0 ${
                            active
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-105 shadow-emerald-200'
                              : done
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-white border-2 border-gray-200 text-gray-400'
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <StepIcon className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <span
                          className={`text-[10px] sm:text-[11px] mt-1.5 font-bold tracking-tight block leading-tight ${
                            active
                              ? 'text-emerald-700 font-black'
                              : done
                              ? 'text-gray-900'
                              : 'text-gray-400 font-medium'
                          }`}
                        >
                          {step.label}
                        </span>

                        {active && (
                          <span className="text-[8px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded uppercase mt-0.5">
                            Current
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2-Column Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left Column: Items & Delivery Address */}
            <div className="lg:col-span-7 space-y-4">
              {/* Items in this Order */}
              <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-2xs">
                <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                      Items in this Order ({items.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    Verified Produce
                  </span>
                </div>

                <div className="divide-y divide-gray-100 mt-2 max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const isItemBulk = item.is_bulk_deal || item.product_name?.includes('(Bulk Wholesale)');
                    const itemTotal = Number(item.price * item.qty).toFixed(2);

                    return (
                      <div key={item._id} className="py-3 first:pt-2 last:pb-1">
                        <div className="flex items-center gap-3">
                          {item.image && typeof item.image === 'string' && item.image.trim() !== '' ? (
                            <img
                              src={item.image}
                              alt={item.product_name || 'Product'}
                              className="w-14 h-14 rounded-xl object-cover bg-gray-50 border border-gray-200 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                              <Package className="w-6 h-6 text-emerald-600" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-black text-gray-950 text-sm leading-tight truncate">
                                  {item.product_name}
                                </h4>
                                {isItemBulk && (
                                  <span className="inline-block mt-0.5 text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded uppercase">
                                    🌾 Wholesale Deal
                                  </span>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-sm font-black text-gray-950">
                                  ₹{itemTotal}
                                </span>
                              </div>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between text-xs">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                                <span>{item.qty} {isItemBulk ? 'kg' : 'units'}</span>
                                <span className="text-gray-400 font-normal">×</span>
                                <span>₹{item.price}</span>
                              </span>

                              {item.deal_token && (
                                <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-[10px]">
                                  Deal: {item.deal_token}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Address Card */}
              {order.shippingAddress && (
                <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-2xs">
                  <div className="flex items-start gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0 mt-0.5 border border-emerald-100">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                          Delivery Destination
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-md">
                          Verified Address
                        </span>
                      </div>
                      <p className="text-gray-950 font-bold text-xs leading-relaxed mt-1 break-words">
                        {order.shippingAddress}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Delivery Partner & Bill Summary */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Delivery Partner Card */}
              {isOutForDelivery && riderName ? (
                <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 border border-emerald-200 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-950 font-black text-xs uppercase tracking-wider">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span>Delivery Partner</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase border border-emerald-200">
                      On The Way
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                          {riderName.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-gray-950 text-sm truncate">
                            {riderName}
                          </h4>
                          <span className="text-[10px] text-amber-600 font-black flex items-center">
                            ★ 4.9
                          </span>
                        </div>
                        {riderPhone && (
                          <p className="text-xs text-gray-500 font-bold truncate">
                            {riderPhone}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            <Bike className="w-3 h-3 text-emerald-600" />
                            <span>{riderVehicle || 'Delivery Bike'}</span>
                            {riderVehicleNo && <span className="text-emerald-950 font-black">({riderVehicleNo})</span>}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200/50">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>Assigned: {assignedTime}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {riderPhone && (
                      <a
                        href={`tel:${riderPhone}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer shrink-0"
                        title={`Call ${riderName}`}
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium px-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Vaccinated & verified delivery partner • Contactless delivery</span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-150 flex items-center gap-3 text-xs text-gray-500">
                  <div className="p-2.5 rounded-xl bg-white border border-gray-200 shrink-0 text-gray-400 shadow-2xs">
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-gray-800 text-xs block">Delivery Partner Assignment</span>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      A dedicated rider will be assigned and live contact details will appear here once the order is <strong>Out for Delivery</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Bill Details Summary Card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-150 space-y-3 text-xs shadow-2xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-gray-900">
                      Bill Summary
                    </span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                    order.payment_status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {order.payment_status === 'completed' ? 'Paid' : 'Payment: Pending'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Items Subtotal */}
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="font-medium">Item Subtotal</span>
                    <span className="font-bold text-gray-900">₹{itemsSubtotal.toFixed(2)}</span>
                  </div>

                  {/* Delivery Charges with Strikethrough if Free */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 font-medium">Delivery Partner Fee</span>
                      <span className="text-[10px] text-gray-400">(&gt;₹199 free)</span>
                    </div>
                    {isFreeDelivery ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 line-through">₹40.00</span>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          FREE
                        </span>
                      </div>
                    ) : (
                      <strong className="text-gray-900 font-bold">
                        ₹{deliveryCharge.toFixed(2)}
                      </strong>
                    )}
                  </div>

                  {/* Handling Fee */}
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="font-medium">Packaging & Handling</span>
                    <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-xs">
                      FREE
                    </span>
                  </div>

                  {/* Savings Card */}
                  {isFreeDelivery && (
                    <div className="text-[10px] text-emerald-800 font-bold bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-2.5 border border-emerald-200 flex items-center gap-2">
                      <span className="text-sm">🎉</span>
                      <span>Yay! You saved <strong>₹40.00</strong> on delivery fee with this order.</span>
                    </div>
                  )}

                  {/* Payment Method Line */}
                  <div className="flex items-center justify-between pt-1 text-gray-600">
                    <span className="font-medium">Payment Mode</span>
                    <span className="font-black text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md">
                      {order.payment_method === 'COD' ? 'Cash on Delivery (COD)' : order.payment_method}
                    </span>
                  </div>

                  {/* Single Final Order Amount */}
                  <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                    <div>
                      <span className="font-black text-gray-950 text-sm block">Total To Pay</span>
                      <span className="text-[10px] text-gray-400 font-medium">Single final amount (all taxes incl.)</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-emerald-700">
                      ₹{Number(order.total_amount || calculatedTotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guarantee & Support Card */}
              <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-150 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Quality & Freshness Guaranteed</span>
                </div>
                <a
                  href="tel:1800123456"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold transition text-[11px]"
                >
                  <HelpCircle className="w-3 h-3 text-emerald-600" />
                  <span>Support</span>
                </a>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Compact Order Card (Clean, Tidy, Informative) ────────────────────────────
function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['Order Placed'];
  const hasBulk = isBulkOrder(order);
  const items = (order.populatedItems && order.populatedItems.length > 0)
    ? order.populatedItems
    : (order.items || []);
  const firstItem = items[0];
  const moreCount = items.length > 1 ? items.length - 1 : 0;

  const itemsSubtotal = items.reduce(
    (acc: number, item: any) => acc + (Number(item.price || 0) * Number(item.qty || item.quantity || 1)),
    0
  );
  const isFreeDelivery = itemsSubtotal >= 199 || Number(order.total_amount || 0) >= 199 || order.delivery_charge === 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white border rounded-2xl shadow-2xs hover:shadow-sm hover:border-emerald-300 transition-all p-3 sm:p-3.5 flex flex-col justify-between gap-2.5 group cursor-pointer ${
        hasBulk ? 'border-emerald-200/80 bg-gradient-to-r from-emerald-50/20 to-white' : 'border-gray-150'
      }`}
    >
      {/* Top row: Order Number + Status */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
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
          {isFreeDelivery && (
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0 flex items-center gap-0.5">
              <span>🎉</span>
              <span>Free Delivery</span>
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
          {firstItem?.image && typeof firstItem.image === 'string' && firstItem.image.trim() !== '' ? (
            <img
              src={firstItem.image}
              alt={firstItem.product_name || 'Product'}
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
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Total:</span>
            <strong className="text-xs sm:text-sm font-black text-emerald-800">
              ₹{Number(order.total_amount || 0).toFixed(2)}
            </strong>
            <span className="text-[10px] text-gray-400">({order.payment_method})</span>
          </div>
          {isFreeDelivery && (
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
              Free Delivery
            </span>
          )}
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
