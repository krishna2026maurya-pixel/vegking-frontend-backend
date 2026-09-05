'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Package, Wallet, User as UserIcon, Heart, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

export default function UserDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load dashboard');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  const handleLogout = async () => {
    localStorage.removeItem('token');
    await signOut({ callbackUrl: '/' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        <p className="text-red-500 font-semibold">{error}</p>
        <Button onClick={() => router.push('/login')}>Go to Login</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-green-100 text-primary rounded-full flex items-center justify-center text-2xl font-bold">
              {data.user.name ? data.user.name.charAt(0).toUpperCase() : <UserIcon />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {data.user.name || 'User'}!</h1>
              <p className="text-sm text-gray-500">{data.user.mobile_no} • {data.user.email || 'No email added'}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Wallet Balance</p>
              <h3 className="text-2xl font-bold text-gray-900">₹{data.user.wallet_balance.toFixed(2)}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="h-12 w-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Orders</p>
              <h3 className="text-2xl font-bold text-gray-900">{data.active_orders?.count || 0}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="h-12 w-12 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Wishlist Items</p>
              <h3 className="text-2xl font-bold text-gray-900">{data.wishlist?.wishlist_count || 0}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Orders */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Active Orders</h2>
            </div>
            <div className="p-6">
              {data.active_orders?.orders?.length > 0 ? (
                <div className="space-y-4">
                  {data.active_orders.orders.map((order: any) => (
                    <div key={order._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-xl gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.order_number}</p>
                        <p className="text-sm text-gray-500">{order.items_count} items • ₹{order.total_amount}</p>
                      </div>
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full w-max">
                        {order.status_label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No active orders</p>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Recent Order History</h2>
            </div>
            <div className="p-6">
              {data.recent_orders?.length > 0 ? (
                <div className="space-y-4">
                  {data.recent_orders.map((order: any) => (
                    <div key={order._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-xl gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.order_number}</p>
                        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()} • ₹{order.total_amount}</p>
                      </div>
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full w-max">
                        {order.status_label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No order history found</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
