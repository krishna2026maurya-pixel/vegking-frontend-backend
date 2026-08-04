'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, MapPin, ArrowRight } from 'lucide-react';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/vendors?limit=100');
        const json = await res.json();
        // Only show verified vendors
        const verified = (json.data || []).filter((v: any) => v.is_verified === '1');
        setVendors(verified);
      } catch (err: any) {
        setError(err.message || 'Failed to load sellers');
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs font-bold text-green-700 uppercase tracking-widest block pb-2 border-b-2 border-green-700/20 w-max mx-auto">
          Partner Merchants
        </span>
        <h1 className="text-4xl font-serif text-[#1e3b2b] font-bold">
          Shop by Seller
        </h1>
        <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
          Sourced directly from verified local growers, farmers, and organic food producers.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-12 text-center text-red-700">
          {error}
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl shadow-sm">
          <Store className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No sellers registered yet</h3>
          <p className="text-gray-500 text-sm mt-1">Check back later for new sellers joining our network.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vendors.map((vendor) => (
            <Link
              key={vendor._id}
              href={`/vendors/${vendor._id}`}
              className="group flex flex-col justify-between border border-gray-100 rounded-3xl bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-green-200"
            >
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center bg-green-50 text-green-700 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                    {vendor.shop_name}
                  </h2>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">
                    Proprietor: {vendor.full_name}
                  </p>
                </div>
                {vendor.city && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span>{vendor.city}</span>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-green-700 group-hover:text-green-800">
                <span>View Products</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
