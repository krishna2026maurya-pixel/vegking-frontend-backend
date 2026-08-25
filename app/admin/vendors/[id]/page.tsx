"use client";

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, Eye, Store, Phone, Mail, MapPin, Wallet, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import DataTable, { Column, Action } from '../../components/DataTable';

interface Product {
  _id: string;
  product_name: string;
  brand: string;
  mrp: number;
  selling_price: number;
  stock_status: number;
  vendor_shop_name: string;
  gst: number;
  product_image?: string;
  quantity?: string;
}

interface Vendor {
  _id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  shop_name: string;
  city: string;
  state?: string;
  address: string;
  pincode?: string;
  gps_location?: string;
  wallet_balance: number;
  is_verified: string;
  is_bestseller: string;
  shop_image?: string;
}

export default function VendorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const vendorId = unwrappedParams.id;
  const router = useRouter();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch Vendor Details
      const vendorRes = await fetch(`/api/vendors/${vendorId}`);
      if (!vendorRes.ok) throw new Error('Vendor not found');
      const vendorData = await vendorRes.json();
      setVendor(vendorData.data);

      // Fetch Vendor Products
      const productsRes = await fetch(`/api/products?vendor_id=${vendorId}&limit=100`);
      if (!productsRes.ok) throw new Error('Failed to load products');
      const productsData = await productsRes.json();
      setProducts(productsData.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<Product>[] = [
    {
      key: 'product_image',
      label: '',
      render: (row) => (
        row.product_image ? (
          <img src={row.product_image} alt={row.product_name} className="w-9 h-9 rounded-lg object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
            {row.product_name?.charAt(0) || 'P'}
          </div>
        )
      )
    },
    { key: 'product_name', label: 'Product Name' },
    {
      key: 'stock_status',
      label: 'Stock',
      render: (row: any) => {
        const count = Number(row.stock_status ?? row.stock ?? 0);
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            count <= 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {count}
          </span>
        );
      }
    },
    { key: 'mrp', label: 'MRP', render: (row) => <span>₹{row.mrp ?? 0}</span> },
    {
      key: 'selling_price',
      label: 'Selling Price',
      render: (row) => <span className="font-semibold text-green-600">₹{row.selling_price ?? 0}</span>
    }
  ];

  const actions: Action<Product>[] = [
    {
      label: 'Edit',
      icon: <Pencil size={15} />,
      onClick: (row) => router.push(`/admin/products/${row._id}`),
      color: 'default'
    },
    {
      label: 'Delete',
      icon: <Trash2 size={15} />,
      color: 'danger',
      onClick: async (row) => {
        if (!confirm(`"${row.product_name}" delete करें?`)) return;
        await fetch(`/api/products/${row._id}`, { method: 'DELETE' });
        fetchData();
      }
    },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">Error: {error}</div>;
  if (!vendor) return <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">Vendor not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/vendors">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{vendor.shop_name}</h1>
          <p className="text-sm text-gray-500">Vendor Detail & Products</p>
        </div>
      </div>

      {/* Vendor Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-green-50 text-green-600">
              {vendor.shop_image ? (
                <img src={vendor.shop_image} alt={vendor.shop_name} className="h-full w-full object-cover" />
              ) : (
                <Store size={20} />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Shop Name</p>
              <p className="text-sm font-medium">{vendor.shop_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Phone className="text-green-600" size={20} />
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Contact</p>
              <p className="text-sm font-medium">{vendor.mobile_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Mail className="text-green-600" size={20} />
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
              <p className="text-sm font-medium">{vendor.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <MapPin className="text-green-600" size={20} />
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Location</p>
              <p className="text-sm font-medium">{Array.from(new Set([vendor.address, vendor.city, vendor.state].filter(Boolean))).join(', ') || vendor.gps_location || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Wallet className="text-green-600" size={20} />
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Wallet Balance</p>
              <p className="text-sm font-bold text-green-600">₹{vendor.wallet_balance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Verification Status</span>
            {vendor.is_verified === '1' ? (
              <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                <CheckCircle size={14} /> VERIFIED
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                <XCircle size={14} /> UNVERIFIED
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Bestseller Badge</span>
            {vendor.is_bestseller === '1' ? (
              <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">ACTIVE</span>
            ) : (
              <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">INACTIVE</span>
            )}
          </div>
          <div className="pt-2">
             <Link href={`/admin/products/create?vendor_id=${vendor._id}`}>
                <button className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-sm text-sm">
                  <Plus size={16} /> Add Product for this Vendor
                </button>
             </Link>
          </div>
        </div>
      </div>

      {/* Vendor Products Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vendor Products ({products.length})</h2>
        </div>

        <DataTable
          data={products}
          columns={columns}
          actions={actions}
          keyExtractor={(row) => row._id}
          loading={loading}
        />

        {products.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-500">
             No products found for this vendor.
          </div>
        )}
      </div>
    </div>
  );
}
