'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Edit3, MapPin, Package, LogOut, Loader2, IndianRupee, ShieldCheck, Bell, Inbox, Scale, Sparkles, MessageSquare, CheckCircle2, ShoppingCart, ArrowRight } from 'lucide-react';
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
    }
  }, [activeTab, session?.user?.id]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'user') {
        router.push('/');
        return;
      }
      fetchProfile();
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
    <div className="min-h-screen bg-gray-50/50 py-8 md:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        
        {/* Profile Header Card */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100/60 text-xl font-black text-green-700">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gray-950">{profile?.name || 'User'}</h1>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700 border border-green-200">Customer</span>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-gray-500">{profile?.email || 'No email set'}</p>
            </div>
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 transition-all hover:bg-red-50 hover:border-red-100 cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          
          {/* Sidebar Tabs */}
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="min-h-[400px]">
            
            {/* My Profile Tab */}
            {activeTab === 'profile' && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-black text-gray-950">My Profile</h2>
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</p>
                      <p className="mt-1 text-base font-black text-gray-950">{profile?.name || 'Not set'}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Mobile Number</p>
                      <p className="mt-1 text-base font-black text-gray-950">{profile?.mobile_no || 'Not set'}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</p>
                      <p className="mt-1 text-base font-black text-gray-950">{profile?.email || 'Not set'}</p>
                    </div>
                  </div>
                  
                  <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-green-900 inline-flex items-center gap-2">
                        <IndianRupee className="h-5 w-5" /> Wallet Balance
                      </h3>
                      <p className="mt-1 text-sm font-medium text-green-700">Use your balance for faster checkouts.</p>
                    </div>
                    <p className="text-2xl font-black text-green-700">₹{profile?.wallet_balance || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Wholesale Deals & Inquiries Tab */}
            {activeTab === 'bulk-deals' && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-950 flex items-center gap-2">
                      <Scale className="h-5 w-5 text-emerald-600" />
                      My Bulk Wholesale Deals
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Your direct price negotiations with farmers and verified vendors (Min 5 kg).
                    </p>
                  </div>

                  <Link
                    href="/bulk-products"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 text-xs font-black uppercase tracking-wider shadow-xs hover:from-amber-600 hover:to-amber-700 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-gray-950" />
                    <span>Explore Bulk Market</span>
                  </Link>
                </div>

                {loadingNegotiations ? (
                  <div className="py-16 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : negotiations.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 space-y-3">
                    <Scale className="w-12 h-12 text-gray-400 mx-auto" />
                    <h3 className="font-extrabold text-sm text-gray-800">No Bulk Negotiations Yet</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Want to buy in bulk (5 kg or more)? Negotiate custom rates directly with growers and vendors on any bulk-enabled product.
                    </p>
                    <Link
                      href="/bulk-products"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow"
                    >
                      <span>Start a Bulk Negotiation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {negotiations.map((neg: any) => {
                      const isAccepted = neg.status === 'ACCEPTED';
                      const isCountered = neg.status === 'COUNTERED';
                      const isRejected = neg.status === 'REJECTED';

                      return (
                        <div
                          key={neg._id}
                          className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                            isAccepted
                              ? 'bg-gradient-to-br from-emerald-50/60 to-white border-emerald-300 shadow-sm'
                              : isCountered
                              ? 'bg-gradient-to-br from-amber-50/50 to-white border-amber-200'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            
                            {/* Product Info */}
                            <div className="flex items-center gap-3.5">
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 relative">
                                <img
                                  src={neg.product_image && neg.product_image.trim() !== '' ? neg.product_image : '/images/product-card-default.jpg'}
                                  alt={neg.product_name || 'Product'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-black text-gray-950 text-sm sm:text-base">{neg.product_name}</h3>
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                    isAccepted ? 'bg-green-100 text-green-800 border border-green-300' :
                                    isCountered ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                    isRejected ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {neg.status}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Vendor: <strong className="text-gray-800">{neg.vendor_id?.shop_name || 'Verified Vendor'}</strong> &bull; Requested: {neg.requested_qty} {neg.unit || 'kg'}
                                </p>
                              </div>
                            </div>

                            {/* Price details & Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-end">
                              <div className="text-left sm:text-right">
                                {isAccepted ? (
                                  <div>
                                    <span className="text-[10px] text-green-700 font-bold block uppercase tracking-wider">Agreed Deal Price</span>
                                    <span className="text-base font-black text-green-800">
                                      ₹{neg.final_agreed_price}/{neg.unit} ({neg.final_agreed_qty} {neg.unit})
                                    </span>
                                    <p className="text-xs font-extrabold text-gray-900">Total: ₹{neg.total_deal_amount}</p>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Current Offer</span>
                                    <span className="text-sm font-bold text-gray-900">
                                      ₹{neg.current_counter_price || neg.initial_offer_price}/{neg.unit}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
                                      className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer shrink-0"
                                    >
                                      <ShoppingCart className="w-3.5 h-3.5" />
                                      <span>Buy Now (₹{neg.total_deal_amount})</span>
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
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>View Chat</span>
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
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-black text-gray-950">Edit Profile</h2>
                
                {message.text && (
                  <div className={`mb-4 rounded-lg p-3 text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">Full Name</label>
                    <Input 
                      value={editForm.name} 
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                      placeholder="Your Name" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">Mobile Number</label>
                    <Input 
                      value={editForm.mobile_no} 
                      onChange={e => setEditForm({ ...editForm, mobile_no: e.target.value })} 
                      placeholder="Phone Number" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">Email Address</label>
                    <Input 
                      type="email"
                      value={editForm.email} 
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })} 
                      placeholder="Email Address" 
                    />
                  </div>
                  <Button type="submit" disabled={saving} className="h-12 w-full mt-2 font-extrabold text-sm cursor-pointer">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </form>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-center py-16">
                <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h2 className="text-xl font-black text-gray-950">My Orders</h2>
                <p className="mt-2 text-sm text-gray-500 mb-6 max-w-sm mx-auto">Track, manage, and separate your retail and bulk wholesale purchases.</p>
                <Link href="/profile/orders" className="inline-flex h-11 items-center justify-center rounded-xl bg-green-600 px-6 text-sm font-extrabold text-white transition hover:bg-green-700">
                  View Order History
                </Link>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <AddressManager />
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-black text-gray-950 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-green-600" />
                    My Notifications
                  </h2>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                      }}
                      className="text-xs font-bold text-green-600 hover:text-green-700 uppercase tracking-wider cursor-pointer"
                    >
                      Clear Badge
                    </button>
                  )}
                </div>

                {loadingNotifications ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-16">
                    <Inbox className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">All caught up!</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">You do not have any notifications at the moment.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-1">
                    {notifications.map((notif: any) => {
                      const isUnread = !notif.isRead;
                      return (
                        <div
                          key={notif._id || notif.id}
                          className={`py-4 flex gap-3.5 transition-all ${isUnread ? 'bg-green-50/10' : ''}`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                            notif.type === 'approved' || notif.title?.toLowerCase().includes('confirm') || notif.title?.toLowerCase().includes('deliver')
                              ? 'text-green-600 bg-green-50 border-green-100/50'
                              : notif.type === 'cancelled' || notif.title?.toLowerCase().includes('cancel')
                              ? 'text-red-600 bg-red-50 border-red-100/50'
                              : 'text-gray-500 bg-gray-50 border-gray-100'
                          }`}>
                            <Bell className="w-4.5 h-4.5" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className={`text-xs sm:text-sm text-gray-900 leading-snug ${isUnread ? 'font-bold' : 'font-semibold'}`}>
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
                            <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
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

      </div>
    </div>
  );
}
