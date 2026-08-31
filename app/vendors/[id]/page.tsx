'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { Store, MapPin, Phone, Mail, ArrowLeft, CheckCircle, Award, Search, Sparkles } from 'lucide-react';

export default function VendorStorePage({ params }: { params?: Promise<{ id: string }> }) {
  const routeParams = useParams();
  const unwrappedParams = params ? use(params) : null;
  const vendorId = (unwrappedParams?.id || routeParams?.id) as string;

  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!vendorId) return;

    const fetchVendorData = async () => {
      try {
        setLoading(true);
        setError('');

        const [vendorRes, productsRes] = await Promise.all([
          fetch(`/api/vendors/${vendorId}`),
          fetch(`/api/products?vendor_id=${vendorId}&limit=100`),
        ]);

        if (!vendorRes.ok) {
          throw new Error('Vendor not found');
        }

        const vendorJson = await vendorRes.json();
        const vendorData = vendorJson.data || vendorJson;
        setVendor(vendorData);

        if (productsRes.ok) {
          const productsJson = await productsRes.json();
          const rawProducts = Array.isArray(productsJson)
            ? productsJson
            : Array.isArray(productsJson.data)
            ? productsJson.data
            : [];

          const mapped = rawProducts.map((p: any) => ({
            ...p,
            name: p.name || p.product_name,
            price: p.price || p.selling_price,
            image: p.image || p.product_image,
            discount:
              (p.mrp && p.selling_price
                ? (((p.mrp - p.selling_price) / p.mrp) * 100).toFixed(1)
                : 0),
            stock: (p.stock !== undefined && p.stock !== null && !isNaN(Number(p.stock)))
              ? Number(p.stock)
              : (p.stock_status !== undefined && p.stock_status !== null && !isNaN(Number(p.stock_status))
                ? Number(p.stock_status)
                : (p.in_stock ? 100 : 0)),
          }));
          setProducts(mapped);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load vendor store');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [vendorId]);

  const filteredProducts = products.filter((product) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      product.name?.toLowerCase().includes(q) ||
      product.product_name?.toLowerCase().includes(q) ||
      product.category?.toLowerCase().includes(q) ||
      product.description?.toLowerCase().includes(q)
    );
  });

  const locationText = vendor
    ? Array.from(
        new Set([vendor.address, vendor.city, vendor.state].filter(Boolean))
      ).join(', ') || vendor.gps_location || ''
    : '';

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/vendors"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all sellers
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error || !vendor ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-12 text-center text-red-700 max-w-lg mx-auto my-12">
            <p className="font-semibold text-lg">{error || 'Vendor not found'}</p>
            <Link
              href="/vendors"
              className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition"
            >
              Browse all sellers
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Vendor Profile Hero Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl overflow-hidden bg-green-50 flex items-center justify-center text-green-700 border border-green-100 shadow-inner">
                  {vendor.shop_image ? (
                    <img
                      src={vendor.shop_image}
                      alt={vendor.shop_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Store className="h-10 w-10" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 truncate">
                      {vendor.shop_name}
                    </h1>
                    {vendor.is_verified === '1' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                        <CheckCircle className="w-3.5 h-3.5" /> Verified Seller
                      </span>
                    )}
                    {vendor.is_bestseller === '1' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        <Award className="w-3.5 h-3.5" /> Bestseller
                      </span>
                    )}
                  </div>

                  {vendor.full_name && (
                    <p className="text-sm text-gray-500 font-medium">
                      Managed by <span className="text-gray-800 font-semibold">{vendor.full_name}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500 pt-1">
                    {locationText && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-green-600 shrink-0" />
                        <span>{locationText}</span>
                      </div>
                    )}
                    {vendor.mobile_number && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4 text-green-600 shrink-0" />
                        <span>{vendor.mobile_number}</span>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-green-600 shrink-0" />
                        <span>{vendor.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 bg-green-50/60 rounded-2xl p-4 border border-green-100 text-center sm:text-right w-full sm:w-auto">
                  <div className="text-2xl font-bold text-green-800">{products.length}</div>
                  <div className="text-xs text-green-700 font-medium">Available Products</div>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                    Products from this Seller
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Fresh produce delivered directly to your doorstep.
                  </p>
                </div>

                {products.length > 0 && (
                  <div className="relative max-w-xs w-full">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search this shop..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                    />
                  </div>
                )}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <Sparkles className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <h3 className="text-base font-semibold text-gray-900">No products found</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {searchQuery
                      ? 'No products matched your search query.'
                      : 'This seller has not listed any products yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product._id || product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
