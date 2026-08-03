import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { 
  LayoutDashboard, Users, ShoppingCart, Truck, Wallet, Settings, Package, 
  ListTree, Tags, Image as ImageIcon, Bell, FileText, CreditCard, Shield, MapPin, Search
} from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user as any).role !== 'admin') {
    redirect('/admin-login');
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-green-600 dark:text-green-500">VegiMart Admin</h1>
        </div>
        
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-gray-700 border-transparent rounded-md text-sm focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500 dark:focus:bg-gray-800"
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
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</div>
            <div className="space-y-1">
              <SidebarItem href="/admin/category-types" icon={<ListTree size={18} />} label="Category Types" />
              <SidebarItem href="/admin/categories" icon={<ListTree size={18} />} label="Categories" />
              <SidebarItem href="/admin/subcategories" icon={<ListTree size={18} />} label="Subcategories" />
              <SidebarItem href="/admin/vendor-categories" icon={<ListTree size={18} />} label="Vendor Categories" />
            </div>
          </div>

          {/* Vendors */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendors</div>
            <div className="space-y-1">
              <SidebarItem href="/admin/vendors" icon={<Users size={18} />} label="Vendors" />
            </div>
          </div>

          {/* Products */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Products</div>
            <div className="space-y-1">
              <SidebarItem href="/admin/brands" icon={<Tags size={18} />} label="Brand List" />
              <SidebarItem href="/admin/products" icon={<Package size={18} />} label="Products" />
              <SidebarItem href="/admin/product-images" icon={<ImageIcon size={18} />} label="Product Images" />
              <SidebarItem href="/admin/vendor-add-products" icon={<Package size={18} />} label="Vendor Products" />
            </div>
          </div>

          {/* Orders */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</div>
            <div className="space-y-1">
              <SidebarItem href="/admin/orders" icon={<ShoppingCart size={18} />} label="Orders" />
              <SidebarItem href="/admin/order-items" icon={<ShoppingCart size={18} />} label="Order Items" />
              <SidebarItem href="/admin/carts" icon={<ShoppingCart size={18} />} label="Cart List" />
            </div>
          </div>

          {/* Delivery */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery</div>
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
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Users</div>
            <div className="space-y-1">
              <SidebarItem href="/admin/users" icon={<Users size={18} />} label="Users" />
              <SidebarItem href="/admin/user-addresses" icon={<MapPin size={18} />} label="User Addresses" />
            </div>
          </div>

          {/* Marketing */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Marketing</div>
            <div className="space-y-1">
              <SidebarItem href="/admin/coupons" icon={<Tags size={18} />} label="Coupon Codes" />
              <SidebarItem href="/admin/abandoned-carts" icon={<ShoppingCart size={18} />} label="Abandoned Carts" />
            </div>
          </div>

          {/* Banner Management */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Banner Management</div>
            <div className="space-y-1">
              <SidebarItem href="/admin/banner-list" icon={<ImageIcon size={18} />} label="Banner List" />
              <SidebarItem href="/admin/banner-setting" icon={<ImageIcon size={18} />} label="Banner Settings" />
            </div>
          </div>

          {/* System & Others */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">System</div>
            <div className="space-y-1">
              <SidebarItem href="/admin/admins" icon={<Shield size={18} />} label="Admins" />
              <SidebarItem href="/admin/wallet-recharges" icon={<Wallet size={18} />} label="Wallet Recharges" />
              <SidebarItem href="/admin/notifications" icon={<Bell size={18} />} label="Notifications" />
              <SidebarItem href="/admin/other-data" icon={<FileText size={18} />} label="Other Data" />
              <SidebarItem href="/admin/settings" icon={<Settings size={18} />} label="Settings" />
            </div>
          </div>

        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
              A
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Admin User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">admin@vegimart.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end px-6 shadow-sm z-10">
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Bell size={20} />
            </button>
            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Settings size={20} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
      <span className="text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
