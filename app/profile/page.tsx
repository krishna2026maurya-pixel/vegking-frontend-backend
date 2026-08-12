'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Edit3, MapPin, Package, LogOut, Loader2, IndianRupee, ShieldCheck, Bell, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressManager } from '@/components/ui/address-manager';
import Image from 'next/image';

const tabs = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'edit', label: 'Edit Profile', icon: Edit3 },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function ProfilePage() {
  const { data: session, status, signOut } = useAuth();
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
    }
  }, [activeTab]);

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
        const err = await res.json();
        setMessage({ text: err.error || 'Update failed', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Something went wrong.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 text-2xl font-black">
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-950">{profile?.name || 'User'}</h1>
              <p className="text-sm font-semibold text-gray-500">{profile?.email || 'No email provided'}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 transition"
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
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
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
                  <Button type="submit" disabled={saving} className="h-12 w-full mt-2 font-extrabold text-sm">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </form>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-center py-16">
                <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h2 className="text-xl font-black text-gray-950">My Orders</h2>
                <p className="mt-2 text-sm text-gray-500 mb-6 max-w-sm mx-auto">Track, manage, and reorder from your previous purchases.</p>
                <Link href="/profile/orders" className="inline-flex h-11 items-center justify-center rounded-xl bg-green-600 px-6 text-sm font-extrabold text-white transition hover:bg-green-700">
                  View Order History
                </Link>
              </div>
            )}

            {activeTab === 'addresses' && (
              <AddressManager />
            )}

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
                      className="text-xs font-bold text-green-600 hover:text-green-700 uppercase tracking-wider"
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
      </div>
    </div>
  );
}
