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
  const pathname = usePathname();

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
        className={`flex items-center px-3 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
          active 
            ? 'bg-gradient-to-r from-emerald-50 to-[#edf7f0] text-emerald-700 dark:from-emerald-950/20 dark:to-green-950/10 dark:text-emerald-400 shadow-xs scale-[1.01]' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/40 dark:hover:text-white'
        }`}
      >
        <span className={`mr-3 flex-shrink-0 transition-colors ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 relative shrink-0">
            <img src="/logo.png" alt="VegKing Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
            VegKing <span className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">Admin</span>
          </h1>
        </div>
        <button 
          onClick={closeSidebar}
          className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="p-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input 
            type="text" 
            placeholder="Search dashboard..." 
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder-gray-400"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Dashboard */}
        <div className="space-y-1">
          <SidebarItem href="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" />
        </div>

        {/* Categories */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Categories</div>
          <div className="space-y-1">
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

      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-100 to-[#e7f7ee] dark:from-emerald-950/40 dark:to-green-950/20 flex items-center justify-center text-green-700 dark:text-green-400 font-bold shrink-0 shadow-xs">
            {sessionUser?.name?.charAt(0) || 'A'}
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{sessionUser?.name || 'Admin User'}</p>
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate mt-0.5">{sessionUser?.email || 'admin@vegimart.com'}</p>
          </div>
        </div>
        <button 
          onClick={() => signOut({ callbackUrl: '/admin-login' })}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors shrink-0"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden animate-fadeIn">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col shrink-0">
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
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col lg:hidden transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between lg:justify-end px-6 shadow-xs shrink-0 z-10">
          {/* Hamburger Menu on Mobile */}
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <Menu size={22} />
          </button>

          {/* Mobile Page Title */}
          <div className="lg:hidden font-extrabold text-sm text-green-600 dark:text-green-500 uppercase tracking-widest">
            VegKing Admin
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors relative cursor-pointer"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </button>

              {showNotificationDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowNotificationDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl p-4 z-40 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-700">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Notifications</h4>
                      <button className="text-[10px] text-emerald-600 hover:underline font-bold cursor-pointer">Mark all read</button>
                    </div>
                    <div className="space-y-3 divide-y divide-gray-50 dark:divide-gray-700/50">
                      <div className="pt-2 text-xs">
                        <p className="font-bold text-gray-800 dark:text-gray-200">New Vendor Sign Up</p>
                        <p className="text-gray-500 mt-0.5">Vendor 'Fresh Greens Co.' is waiting for verification.</p>
                        <span className="text-[9px] text-gray-400 font-semibold block mt-1">2 mins ago</span>
                      </div>
                      <div className="pt-2 text-xs">
                        <p className="font-bold text-gray-800 dark:text-gray-200">Stock Alert</p>
                        <p className="text-gray-500 mt-0.5">Product 'Organic Apple' is running low on stock (less than 10kg).</p>
                        <span className="text-[9px] text-gray-400 font-semibold block mt-1">1 hr ago</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <Link 
              href="/admin/settings"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
            >
              <Settings size={18} />
            </Link>
          </div>
        </header>

        {/* Page Children Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
