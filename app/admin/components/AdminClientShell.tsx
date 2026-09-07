'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, Users, ShoppingCart, Truck, Wallet, Settings, Package, 
  ListTree, Tags, Image as ImageIcon, Bell, FileText, CreditCard, Shield, MapPin, Search,
  Menu, X, LogOut
} from 'lucide-react';

interface AdminClientShellProps {
  children: React.ReactNode;
  sessionUser: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function AdminClientShell({ children, sessionUser }: AdminClientShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [feedNotifications, setFeedNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  const fetchFeedNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/feed?role=admin', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (json.data) {
        setFeedNotifications(json.data);
        setUnreadCount(json.unreadCount || 0);
      }
    } catch {}
  };

  React.useEffect(() => {
    fetchFeedNotifications();
    const interval = setInterval(fetchFeedNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  const markAllFeedRead = async () => {
    try {
      await fetch('/api/notifications/feed', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true, role: 'admin' }),
      });
      setUnreadCount(0);
      setFeedNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const SidebarItem = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => {
    const active = isActive(href);
    return (
      <Link 
        href={href} 
        onClick={closeSidebar}
        className={`flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
          active 
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold shadow-2xs' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/40 dark:hover:text-white'
        }`}
      >
        <span className={`mr-2.5 flex-shrink-0 transition-colors ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 relative shrink-0">
            <img src="/logo.png" alt="VegKing Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-base font-black tracking-tight bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
            VegKing <span className="text-gray-400 dark:text-gray-500 font-bold text-[9px] uppercase tracking-widest ml-1">Admin</span>
          </h1>
        </div>
        <button 
          onClick={closeSidebar}
          className="lg:hidden p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="p-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-8 pr-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-xs focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all placeholder-gray-400"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2.5 px-2 space-y-4">
        {/* Dashboard */}
        <div className="space-y-0.5">
          <SidebarItem href="/admin" icon={<LayoutDashboard size={16} />} label="Dashboard" />
        </div>

        {/* Categories */}
        <div>
          <div className="px-2 mb-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Categories</div>
          <div className="space-y-0.5">
            <SidebarItem href="/admin/category-types" icon={<ListTree size={18} />} label="Category Types" />
            <SidebarItem href="/admin/categories" icon={<ListTree size={18} />} label="Categories" />
            <SidebarItem href="/admin/subcategories" icon={<ListTree size={18} />} label="Subcategories" />
            <SidebarItem href="/admin/vendor-categories" icon={<ListTree size={18} />} label="Vendor Categories" />
          </div>
        </div>

        {/* Vendors */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Vendors</div>
          <div className="space-y-1">
            <SidebarItem href="/admin/vendors" icon={<Users size={18} />} label="Vendors" />
          </div>
        </div>

        {/* Products */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Products</div>
          <div className="space-y-1">
            <SidebarItem href="/admin/brands" icon={<Tags size={18} />} label="Brand List" />
            <SidebarItem href="/admin/products" icon={<Package size={18} />} label="Products" />
            <SidebarItem href="/admin/product-images" icon={<ImageIcon size={18} />} label="Product Images" />
            <SidebarItem href="/admin/vendor-add-products" icon={<Package size={18} />} label="Vendor Products" />
          </div>
        </div>

        {/* Orders */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Orders</div>
          <div className="space-y-1">
            <SidebarItem href="/admin/orders" icon={<ShoppingCart size={18} />} label="Orders" />
            <SidebarItem href="/admin/order-items" icon={<ShoppingCart size={18} />} label="Order Items" />
            <SidebarItem href="/admin/carts" icon={<ShoppingCart size={18} />} label="Cart List" />
          </div>
        </div>

        {/* Delivery */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Delivery</div>
          <div className="space-y-1">
            <SidebarItem href="/admin/delivery-boys" icon={<Truck size={18} />} label="Delivery Boys" />
            <SidebarItem href="/admin/active-delivery-boys" icon={<Truck size={18} />} label="Active Delivery Boys" />
            <SidebarItem href="/admin/pending-delivery-boys" icon={<Truck size={18} />} label="Pending Delivery Boys" />
            <SidebarItem href="/admin/delivery-charges" icon={<CreditCard size={18} />} label="Delivery Charges" />
            <SidebarItem href="/admin/delivery-transactions" icon={<Wallet size={18} />} label="Delivery Transactions" />
          </div>
        </div>

        {/* Users */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Users</div>
          <div className="space-y-1">
            <SidebarItem href="/admin/users" icon={<Users size={18} />} label="Users" />
            <SidebarItem href="/admin/user-addresses" icon={<MapPin size={18} />} label="User Addresses" />
          </div>
        </div>

        {/* Marketing */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Marketing</div>
          <div className="space-y-1">
            <SidebarItem href="/admin/coupons" icon={<Tags size={18} />} label="Coupon Codes" />
            <SidebarItem href="/admin/abandoned-carts" icon={<ShoppingCart size={18} />} label="Abandoned Carts" />
          </div>
        </div>

        {/* Banner Management */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Banner Management</div>
          <div className="space-y-1">
            <SidebarItem href="/admin/banner-list" icon={<ImageIcon size={18} />} label="Banner List" />
            <SidebarItem href="/admin/banner-setting" icon={<ImageIcon size={18} />} label="Banner Settings" />
          </div>
        </div>

        {/* System & Others */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">System</div>
          <div className="space-y-1">
            <SidebarItem href="/admin/admins" icon={<Shield size={18} />} label="Admins" />
            <SidebarItem href="/admin/wallet-recharges" icon={<Wallet size={18} />} label="Wallet Recharges" />
            <SidebarItem href="/admin/notifications" icon={<Bell size={18} />} label="Notifications" />
            <SidebarItem href="/admin/other-data" icon={<FileText size={18} />} label="Other Data" />
            <SidebarItem href="/admin/settings" icon={<Settings size={18} />} label="Settings" />
          </div>
        </div>
      </nav>

      <div className="p-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-100 to-[#e7f7ee] dark:from-emerald-950/40 dark:to-green-950/20 flex items-center justify-center text-green-700 dark:text-green-400 font-bold shrink-0 text-xs">
            {sessionUser?.name?.charAt(0) || 'A'}
          </div>
          <div className="ml-2 min-w-0">
            <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">{sessionUser?.name || 'Admin User'}</p>
            <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 truncate">{sessionUser?.email || 'admin@vegking.com'}</p>
          </div>
        </div>
        <button 
          onClick={() => signOut({ callbackUrl: '/admin-login' })}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors shrink-0"
          title="Sign Out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden animate-fadeIn">
      {/* Desktop Sidebar - Compact w-56 */}
      <aside className="hidden lg:flex lg:w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Slide-over */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity" 
          onClick={closeSidebar}
        />
      )}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col lg:hidden transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header className="h-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between lg:justify-end px-5 shadow-xs shrink-0 z-10">
          {/* Hamburger Menu on Mobile */}
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Mobile Page Title */}
          <div className="lg:hidden font-extrabold text-xs text-green-600 dark:text-green-500 uppercase tracking-widest">
            VegKing Admin
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotificationDropdown(!showNotificationDropdown);
                  fetchFeedNotifications();
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center px-1 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotificationDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowNotificationDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-84 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xl p-4 z-40 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-700">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Notifications</h4>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={markAllFeedRead}
                        className="text-[10px] text-emerald-600 hover:underline font-bold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-gray-50 dark:divide-gray-700/50">
                      {feedNotifications.length === 0 ? (
                        <p className="text-xs text-gray-400 py-3 text-center">No notifications yet.</p>
                      ) : (
                        feedNotifications.slice(0, 6).map((n) => (
                          <div key={n._id} className="pt-2 text-xs">
                            <div className="flex items-center justify-between">
                              <p className={`font-bold ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                {n.title}
                              </p>
                              {!n.isRead && (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 ml-1" />
                              )}
                            </div>
                            <p className="text-gray-500 mt-0.5 text-[11px] leading-snug">{n.message}</p>
                            <span className="text-[9px] text-gray-400 font-semibold block mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Quick Live Popup Testing Buttons */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Test Live Popup:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch('/api/notifications/feed', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'test_order' }),
                            });
                          }}
                          className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded transition cursor-pointer"
                          title="Generate a live test order notification popup"
                        >
                          + Order
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch('/api/notifications/feed', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'test_user' }),
                            });
                          }}
                          className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 rounded transition cursor-pointer"
                          title="Generate a live customer signup notification popup"
                        >
                          + User
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch('/api/notifications/feed', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'test_vendor' }),
                            });
                          }}
                          className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 rounded transition cursor-pointer"
                          title="Generate a live vendor application notification popup"
                        >
                          + Vendor
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <Link 
              href="/admin/settings"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              <Settings size={17} />
            </Link>
          </div>
        </header>

        {/* Page Children Container with proper top spacing */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
