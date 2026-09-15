'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Edit3, MapPin, Package, LogOut, Loader2, IndianRupee, 
  ShieldCheck, Bell, Inbox, Scale, Sparkles, MessageSquare, 
  CheckCircle2, ShoppingCart, ArrowRight, Tag, Truck, RefreshCw, 
  Check, Copy, Clock, AlertCircle, Zap
} from 'lucide-react';
import { OrderDetailModal, STATUS_CONFIG, Order } from '@/app/profile/orders/page';
import { normalizeOrderStatus } from '@/lib/order-status-rules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressManager } from '@/components/ui/address-manager';
import NegotiationModal from '@/components/NegotiationModal';
import DealCountdownTimer from '@/components/DealCountdownTimer';
import Image from 'next/image';

const tabs = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'bulk-deals', label: 'Bulk Wholesale Deals', icon: Scale },
  { id: 'edit', label: 'Edit Profile', icon: Edit3 },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function ProfilePage() {
  const { data: session, status, signOut } = useAuth();
  const { addBulkDealToCart } = useCart();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Orders state (for displaying all ordered products directly in My Orders tab)
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderFilter, setOrderFilter] = useState<'All' | 'Active' | 'Delivered'>('All');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Edit state
  const [editForm, setEditForm] = useState({ name: '', mobile_no: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Bulk Inquiries / Deals state
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [loadingNegotiations, setLoadingNegotiations] = useState(false);
  const [selectedNegotiateProduct, setSelectedNegotiateProduct] = useState<any>(null);

  const acceptedNegotiations = useMemo(() => {
    return negotiations.filter((n: any) => n.status === 'ACCEPTED');
  }, [negotiations]);

  const fetchOrders = async (isSilent = false) => {
    if (!isSilent) setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders?limit=50', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || [];
        setOrders(list);
        setSelectedOrder((prev) => {
          if (!prev) return null;
          const matching = list.find((o: any) => o._id === prev._id);
          return matching ? { ...prev, ...matching } : null;
        });
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      if (!isSilent) setLoadingOrders(false);
    }
  };

  const handleCopyOrderNum = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const fetchNegotiations = async () => {
    if (!session?.user?.id) return;
    setLoadingNegotiations(true);
    try {
      const res = await fetch(`/api/negotiations?user_id=${session.user.id}`);
      if (res.ok) {
        const json = await res.json();
        setNegotiations(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load negotiations', err);
    } finally {
      setLoadingNegotiations(false);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await fetch('/api/v1/user/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load notifications');
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
    } else if (activeTab === 'bulk-deals') {
      fetchNegotiations();
    } else if (activeTab === 'orders') {
      fetchOrders(false);
      const timer = setInterval(() => {
        fetchOrders(true);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [activeTab, session?.user?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam && tabs.some((t) => t.id === tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'user') {
        router.push('/');
        return;
      }
      fetchProfile();
      fetchNegotiations();
    }
  }, [status, router, session]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setEditForm({ name: data.user.name || '', mobile_no: data.user.mobile_no || '', email: data.user.email || '' });
      }
    } catch (err) {
      console.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        fetchProfile();
      } else {
        const data = await res.json();
        setMessage({ text: data.message || 'Failed to update profile', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 py-4 sm:py-6">
      <div className="mx-auto max-w-5xl px-3.5 sm:px-6">
        
        {/* Compact Profile Header Card */}
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 text-base sm:text-lg font-black text-green-800 border border-green-200/60">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-black text-gray-950 truncate">{profile?.name || 'User'}</h1>
                <span className="rounded-full bg-green-50 px-2 py-0.2 text-[10px] font-bold text-green-700 border border-green-200/80">Customer</span>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-gray-500 truncate">{profile?.email || 'No email set'}</p>
            </div>
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 hover:border-red-200 cursor-pointer shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[200px_1fr] gap-3.5 sm:gap-5">
          
          {/* Navigation Tabs: Horizontal scroll pill bar on mobile, vertical sidebar on desktop */}
          <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none lg:flex-col lg:space-y-1 lg:overflow-visible shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-green-600 text-white shadow-xs font-extrabold'
                      : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.id === 'bulk-deals' && acceptedNegotiations.length > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white text-green-700' : 'bg-green-100 text-green-800'
                    }`}>
                      {acceptedNegotiations.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="min-w-0 flex-1">
            
            {/* My Profile Tab */}
            {activeTab === 'profile' && (
              <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h2 className="text-sm sm:text-base font-black text-gray-950 flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    My Profile Details
                  </h2>
                  <button
                    onClick={() => setActiveTab('edit')}
                    className="text-xs font-bold text-green-700 hover:text-green-800 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200/60 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Full Name</p>
                    <p className="mt-0.5 text-xs sm:text-sm font-bold text-gray-950">{profile?.name || 'Not set'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mobile Number</p>
                    <p className="mt-0.5 text-xs sm:text-sm font-bold text-gray-950">{profile?.mobile_no || 'Not set'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</p>
                    <p className="mt-0.5 text-xs sm:text-sm font-bold text-gray-950">{profile?.email || 'Not set'}</p>
                  </div>
                </div>

                {/* Highlight active accepted wholesale deals */}
                {acceptedNegotiations.length > 0 && (
                  <div className="rounded-xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-green-50/50 to-white p-3.5 sm:p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                          <Zap className="w-3.5 h-3.5 fill-current" />
                        </span>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black text-gray-950">
                            Approved Bulk Wholesale Deals ({acceptedNegotiations.length})
                          </h3>
                          <p className="text-[10px] text-emerald-800 font-semibold">Vendor accepted your offer! Ready for checkout.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('bulk-deals')}
                        className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        View All
                      </button>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {acceptedNegotiations.map((neg: any) => (
                        <div
                          key={neg._id}
                          className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-emerald-200 shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={neg.product_image && neg.product_image.trim() !== '' ? neg.product_image : '/images/product-card-default.jpg'}
                              alt={neg.product_name}
                              className="w-11 h-11 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                            <div className="min-w-0 text-xs">
                              <h4 className="font-extrabold text-gray-950 truncate">{neg.product_name}</h4>
                              <div className="text-[11px] text-emerald-700 font-black">
                                ₹{neg.final_agreed_price}/{neg.unit} ({neg.final_agreed_qty} {neg.unit})
                              </div>
                              <p className="text-[10px] font-bold text-gray-600">Total: ₹{neg.total_deal_amount}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              addBulkDealToCart({
                                negotiation_id: neg._id,
                                product_id: neg.product_id,
                                product_name: neg.product_name,
                                product_image: neg.product_image,
                                agreed_rate: neg.final_agreed_price,
                                agreed_qty: neg.final_agreed_qty,
                                unit: neg.unit,
                                deal_token: neg.deal_token,
                              }, e);
                              router.push('/cart');
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg text-xs font-black shadow-xs flex items-center gap-1 transition cursor-pointer shrink-0"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Order</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50 via-green-50/60 to-white p-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-emerald-900 inline-flex items-center gap-1.5">
                      <IndianRupee className="h-4 w-4 text-emerald-700" /> Wallet Balance
                    </h3>
                    <p className="text-[11px] font-medium text-emerald-700 mt-0.5">Use balance for instant 1-click checkouts</p>
                  </div>
                  <p className="text-lg sm:text-xl font-black text-emerald-700">₹{profile?.wallet_balance || 0}</p>
                </div>

                <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    <Package className="h-3.5 w-3.5 text-green-600" />
                    <span>View Orders ({orders.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    <MapPin className="h-3.5 w-3.5 text-green-600" />
                    <span>Manage Addresses</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bulk Wholesale Deals & Inquiries Tab */}
            {activeTab === 'bulk-deals' && (
              <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 flex-wrap">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-gray-950 flex items-center gap-1.5">
                      <Scale className="h-4 w-4 text-emerald-600" />
                      My Bulk Wholesale Deals
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Direct rate negotiations with farmers and verified vendors (Min 5 kg).
                    </p>
                  </div>

                  <Link
                    href="/bulk-products"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 text-xs font-black uppercase tracking-wider shadow-xs hover:from-amber-600 hover:to-amber-700 transition"
                  >
                    <Sparkles className="w-3 h-3 text-gray-950" />
                    <span>Bulk Market</span>
                  </Link>
                </div>

                {loadingNegotiations ? (
                  <div className="py-10 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : negotiations.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50/70 rounded-xl border border-dashed border-gray-200 space-y-2 p-4">
                    <Scale className="w-8 h-8 text-gray-400 mx-auto" />
                    <h3 className="font-extrabold text-xs text-gray-800">No Bulk Negotiations Yet</h3>
                    <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                      Negotiate custom rates directly with growers on bulk-enabled produce.
                    </p>
                    <Link
                      href="/bulk-products"
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs mt-1"
                    >
                      <span>Start a Bulk Negotiation</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-2.5">
                    {negotiations.map((neg: any) => {
                      const isAccepted = neg.status === 'ACCEPTED';
                      const isCountered = neg.status === 'COUNTERED';
                      const isRejected = neg.status === 'REJECTED';

                      return (
                        <div
                          key={neg._id}
                          className={`rounded-xl p-3 sm:p-3.5 border transition-all ${
                            isAccepted
                              ? 'bg-gradient-to-br from-emerald-50/50 to-white border-emerald-300 shadow-2xs'
                              : isCountered
                              ? 'bg-gradient-to-br from-amber-50/40 to-white border-amber-200'
                              : 'bg-white border-gray-200/80'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Product Info */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 relative">
                                <img
                                  src={neg.product_image && neg.product_image.trim() !== '' ? neg.product_image : '/images/product-card-default.jpg'}
                                  alt={neg.product_name || 'Product'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h3 className="font-black text-gray-950 text-xs sm:text-sm truncate">{neg.product_name}</h3>
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
                                    isAccepted ? 'bg-green-100 text-green-800 border border-green-300' :
                                    isCountered ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                    isRejected ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {neg.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                  Vendor: <strong className="text-gray-800">{neg.vendor_id?.shop_name || 'Verified Vendor'}</strong> &bull; Qty: {neg.requested_qty} {neg.unit || 'kg'}
                                </p>
                              </div>
                            </div>

                            {/* Price details & Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                              <div className="text-left sm:text-right">
                                {isAccepted ? (
                                  <div>
                                    <span className="text-[9px] text-green-700 font-bold uppercase tracking-wider block">Agreed Rate</span>
                                    <span className="text-xs sm:text-sm font-black text-green-800">
                                      ₹{neg.final_agreed_price}/{neg.unit} ({neg.final_agreed_qty} {neg.unit})
                                    </span>
                                    <p className="text-[11px] font-extrabold text-gray-900">Total: ₹{neg.total_deal_amount}</p>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Current Offer</span>
                                    <span className="text-xs sm:text-sm font-bold text-gray-900">
                                      ₹{neg.current_counter_price || neg.initial_offer_price}/{neg.unit}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {isAccepted ? (
                                  <>
                                    <DealCountdownTimer
                                      variant="badge"
                                      expiresAt={neg.deal_expires_at}
                                      fallbackStartTime={neg.updatedAt}
                                    />
                                    <button
                                      onClick={(e) => {
                                        addBulkDealToCart({
                                          negotiation_id: neg._id,
                                          product_id: neg.product_id,
                                          product_name: neg.product_name,
                                          product_image: neg.product_image,
                                          agreed_rate: neg.final_agreed_price,
                                          agreed_qty: neg.final_agreed_qty,
                                          unit: neg.unit,
                                          deal_token: neg.deal_token,
                                        }, e);
                                        router.push('/cart');
                                      }}
                                      className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-xs font-black shadow-xs flex items-center gap-1 transition cursor-pointer shrink-0"
                                    >
                                      <ShoppingCart className="w-3 h-3" />
                                      <span>Buy (₹{neg.total_deal_amount})</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => setSelectedNegotiateProduct({
                                      _id: neg.product_id,
                                      name: neg.product_name,
                                      image: neg.product_image,
                                      price: neg.current_counter_price || neg.initial_offer_price,
                                      bulk_min_qty: neg.requested_qty,
                                      bulk_unit: neg.unit,
                                      vendor_shop_name: neg.vendor_id?.shop_name || 'Vendor',
                                    })}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    <span>Chat</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Edit Profile Tab */}
            {activeTab === 'edit' && (
              <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
                <div className="pb-3 border-b border-gray-100">
                  <h2 className="text-sm sm:text-base font-black text-gray-950 flex items-center gap-1.5">
                    <Edit3 className="h-4 w-4 text-green-600" />
                    Edit Profile Information
                  </h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">Keep your contact details up to date for deliveries</p>
                </div>
                
                {message.text && (
                  <div className={`rounded-lg p-2.5 text-xs font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-3 max-w-md">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">Full Name</label>
                    <Input 
                      value={editForm.name} 
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                      placeholder="Your Name" 
                      required 
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">Mobile Number</label>
                    <Input 
                      value={editForm.mobile_no} 
                      onChange={e => setEditForm({ ...editForm, mobile_no: e.target.value })} 
                      placeholder="Phone Number" 
                      required 
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">Email Address</label>
                    <Input 
                      type="email"
                      value={editForm.email} 
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })} 
                      placeholder="Email Address" 
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <Button type="submit" disabled={saving} className="h-9 w-full mt-1 font-extrabold text-xs cursor-pointer rounded-xl bg-green-600 hover:bg-green-700">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                    Save Changes
                  </Button>
                </form>
              </div>
            )}

            {/* Orders Tab - Shows All Ordered Products */}
            {activeTab === 'orders' && (
              <div className="space-y-3">
                {/* Header bar */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-gray-950 flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-green-600" />
                      My Orders &amp; Ordered Products
                    </h2>
                    <p className="mt-0.5 text-[11px] text-gray-500 font-medium">
                      All purchased items, live tracking, and coupon savings
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fetchOrders(false)}
                      disabled={loadingOrders}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Refresh Orders"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin text-green-600' : ''}`} />
                      <span className="hidden sm:inline text-xs">Refresh</span>
                    </button>
                    <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-bold">
                      {(['All', 'Active', 'Delivered'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setOrderFilter(filter)}
                          className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                            orderFilter === filter
                              ? 'bg-white text-gray-950 shadow-xs font-extrabold'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Orders List */}
                {loadingOrders && orders.length === 0 ? (
                  <div className="rounded-2xl border border-gray-200/80 bg-white p-8 text-center shadow-2xs space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600 mx-auto" />
                    <p className="text-xs font-bold text-gray-600">Loading your ordered products...</p>
                  </div>
                ) : (() => {
                  const filteredOrders = orders.filter((o) => {
                    if (orderFilter === 'Active') {
                      return o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled';
                    }
                    if (orderFilter === 'Delivered') {
                      return o.orderStatus === 'Delivered';
                    }
                    return true;
                  });

                  if (filteredOrders.length === 0) {
                    return (
                      <div className="rounded-2xl border border-gray-200/80 bg-white p-8 text-center shadow-2xs space-y-2">
                        <Package className="mx-auto h-8 w-8 text-gray-300" />
                        <h3 className="text-xs font-black text-gray-900">
                          {orderFilter === 'All' ? 'No orders found' : `No ${orderFilter.toLowerCase()} orders`}
                        </h3>
                        <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                          {orderFilter === 'All'
                            ? "You haven't placed any orders yet. Fresh produce is just a click away!"
                            : `You have no orders currently in "${orderFilter}" status.`}
                        </p>
                        <Link
                          href="/"
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-green-600 px-3.5 text-xs font-extrabold text-white transition hover:bg-green-700 mt-1"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Shop Fresh Produce</span>
                        </Link>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filteredOrders.map((order) => {
                        const cfg = STATUS_CONFIG[normalizeOrderStatus(order.orderStatus)] || STATUS_CONFIG['Order Placed'];
                        const items = (order.populatedItems && order.populatedItems.length > 0)
                          ? order.populatedItems
                          : (order.items || []);
                        
                        const itemsSubtotal = items.reduce(
                          (acc: number, it: any) => acc + (Number(it.price || 0) * Number(it.qty || it.quantity || 1)),
                          0
                        );
                        const isFreeDelivery = itemsSubtotal >= 199 || Number(order.total_amount || 0) >= 199 || order.delivery_charge === 0;

                        let couponDiscount = Number(order.coupon_discount || 0);
                        if (couponDiscount <= 0 && itemsSubtotal > 0 && Number(order.total_amount || 0) > 0) {
                          const rawExpected = itemsSubtotal + (isFreeDelivery ? 0 : 40);
                          if (rawExpected > Number(order.total_amount)) {
                            couponDiscount = Math.max(0, Math.round((rawExpected - Number(order.total_amount)) * 100) / 100);
                          }
                        }
                        const hasCoupon = couponDiscount > 0 || Boolean(order.coupon_code);
                        const couponCode = order.coupon_code || (couponDiscount > 0 ? 'COUPON' : null);

                        return (
                          <div
                            key={order._id}
                            className="rounded-xl border border-gray-200/90 bg-white p-3 sm:p-3.5 shadow-2xs space-y-2.5 hover:border-green-400 transition-all"
                          >
                            {/* Top Row: Order info & Status */}
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-xs sm:text-sm text-gray-950">
                                  {order.order_number}
                                </span>
                                <button
                                  onClick={() => handleCopyOrderNum(order._id, order.order_number)}
                                  className="p-0.5 rounded text-gray-400 hover:text-green-700 hover:bg-green-50 transition text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer"
                                  title="Copy Order Number"
                                >
                                  {copiedOrderId === order._id ? (
                                    <>
                                      <Check className="w-3 h-3 text-green-600" />
                                      <span className="text-green-600 text-[9px]">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span className="text-[9px]">Copy</span>
                                    </>
                                  )}
                                </button>
                                <span className="text-[11px] text-gray-400 font-medium">
                                  &bull; {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>

                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${cfg.color} ${cfg.bg}`}>
                                {cfg.icon}
                                <span>{cfg.label}</span>
                              </span>
                            </div>

                            {/* Ordered Products List (Shows all products in this order) */}
                            <div className="bg-gray-50/80 rounded-lg p-2 sm:p-2.5 border border-gray-100 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-gray-400 pb-1 border-b border-gray-200/60">
                                <span>Products Ordered ({items.length})</span>
                                <span>Item Total</span>
                              </div>
                              <div className="divide-y divide-gray-100">
                                {items.map((item: any, idx: number) => {
                                  const qty = Number(item.qty || item.quantity || 1);
                                  const price = Number(item.price || 0);
                                  const itemTotal = qty * price;
                                  return (
                                    <div
                                      key={item._id || idx}
                                      className="py-1.5 first:pt-0.5 last:pb-0.5 flex items-center justify-between gap-2.5 text-xs"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {item.image && typeof item.image === 'string' && item.image.trim() !== '' ? (
                                          <img
                                            src={item.image}
                                            alt={item.product_name || 'Product'}
                                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-white shrink-0 shadow-2xs"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 text-gray-400">
                                            <Package className="w-4 h-4" />
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <h4 className="font-bold text-gray-900 text-xs truncate max-w-[180px] sm:max-w-xs">
                                            {item.product_name || item.name || 'Fresh Produce'}
                                          </h4>
                                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5 flex-wrap">
                                            <span className="font-semibold text-gray-800 bg-white px-1 py-0.2 rounded border border-gray-200 text-[10px]">
                                              {qty} &times; ₹{price.toFixed(2)}
                                            </span>
                                            {item.is_bulk_deal && (
                                              <span className="bg-amber-100 text-amber-900 text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                                                🌾 Bulk Deal
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <span className="font-black text-gray-950 text-xs shrink-0">
                                        ₹{itemTotal.toFixed(2)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Order Financials & Action Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400 font-bold uppercase text-[9px]">Total:</span>
                                  <span className="text-sm font-black text-green-700">
                                    ₹{Number(order.total_amount || 0).toFixed(2)}
                                  </span>
                                  <span className="text-gray-400 text-[10px] font-semibold">
                                    ({order.payment_method === 'COD' ? 'COD' : 'Paid'})
                                  </span>
                                </div>

                                {hasCoupon && (
                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                                    <Tag className="w-2 h-2 text-emerald-600" />
                                    <span>{couponCode} (-₹{couponDiscount.toFixed(2)})</span>
                                  </span>
                                )}

                                {isFreeDelivery && (
                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                    Free Delivery
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-black transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer self-end sm:self-auto shrink-0"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Track &amp; View Details</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <AddressManager />
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                  <h2 className="text-sm sm:text-base font-black text-gray-950 flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-green-600" />
                    My Notifications
                  </h2>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                      }}
                      className="text-[11px] font-bold text-green-600 hover:text-green-700 uppercase tracking-wider cursor-pointer"
                    >
                      Clear Badge
                    </button>
                  )}
                </div>

                {loadingNotifications ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-10 space-y-1">
                    <Inbox className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <h3 className="text-xs font-bold text-gray-800">All caught up!</h3>
                    <p className="text-[11px] text-gray-500 max-w-xs mx-auto">You do not have any notifications at the moment.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto pr-1">
                    {notifications.map((notif: any) => {
                      const isUnread = !notif.isRead;
                      return (
                        <div
                          key={notif._id || notif.id}
                          className={`py-2.5 flex gap-2.5 transition-all text-xs ${isUnread ? 'bg-green-50/10' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            notif.type === 'approved' || notif.title?.toLowerCase().includes('confirm') || notif.title?.toLowerCase().includes('deliver')
                              ? 'text-green-600 bg-green-50 border-green-100'
                              : notif.type === 'cancelled' || notif.title?.toLowerCase().includes('cancel')
                              ? 'text-red-600 bg-red-50 border-red-100'
                              : 'text-gray-500 bg-gray-50 border-gray-100'
                          }`}>
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className={`text-xs text-gray-900 leading-snug truncate ${isUnread ? 'font-bold' : 'font-medium'}`}>
                                {notif.title}
                              </h4>
                              <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">
                                {new Date(notif.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                              {notif.message || notif.body}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Live Negotiation Modal for customer chat/counter from dashboard */}
        <NegotiationModal
          isOpen={!!selectedNegotiateProduct}
          onClose={() => {
            setSelectedNegotiateProduct(null);
            fetchNegotiations();
          }}
          product={selectedNegotiateProduct}
        />

        {/* Order Detail & Tracking Modal */}
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => {
              setSelectedOrder(null);
              fetchOrders(false);
            }}
            onOrderCancelled={() => fetchOrders(false)}
          />
        )}

      </div>
    </div>
  );
}
