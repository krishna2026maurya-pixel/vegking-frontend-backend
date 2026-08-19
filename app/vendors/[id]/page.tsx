'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { ArrowLeft, Store, MapPin, Phone, Mail, PackageOpen } from 'lucide-react';

export default function VendorDetailProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const vendorId = unwrappedParams.id;
  const router = useRouter();

  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!vendorId) return;
    const fetchVendorDetailsAndProducts = async () => {
      try {
        setLoading(true);
        // Fetch vendor profile details
        const vendorRes = await fetch(`/api/vendors/${vendorId}`);
        const vendorJson = await vendorRes.json();
        if (!vendorRes.ok) throw new Error('Seller profile not found');
        setVendor(vendorJson.data);

        // Fetch vendor specific products (with vendor_id query to ensure no grouping/collapsing)
        const productsRes = await fetch(`/api/products?vendor_id=${vendorId}&limit=100`);
        const productsJson = await productsRes.json();
        setProducts(productsJson.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load seller catalog');
      } finally {
        setLoading(false);
      }
    };
    fetchVendorDetailsAndProducts();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="max-w-[90rem] mx-auto px-4 py-20 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-serif font-bold text-red-700">{error || 'Seller Not Found'}</h2>
        <button onClick={() => router.push('/vendors')} className="inline-flex items-center gap-2 text-green-700 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Sellers
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <Link href="/vendors" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-green-700 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to all sellers
        </Link>
        
        {/* Vendor Header Profile Card */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 bg-green-50 text-green-700 rounded-3xl flex items-center justify-center shrink-0 overflow-hidden">
              {vendor.shop_image ? (
                <img src={vendor.shop_image} alt={vendor.shop_name} className="h-full w-full object-cover" />
              ) : (
                <Store className="h-8 w-8" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-serif text-[#1e3b2b] font-bold">{vendor.shop_name}</h1>
              <p className="text-sm font-semibold text-gray-400 mt-1">Proprietor: {vendor.full_name}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-gray-500 md:border-l md:border-gray-100 md:pl-8">
            {vendor.mobile_number && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{vendor.mobile_number}</span>
              </div>
            )}
            {vendor.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{vendor.email}</span>
              </div>
            )}
            {vendor.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{vendor.address ? `${vendor.address}, ` : ''}{vendor.city}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Products Catalog */}
      <div className="space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-serif text-[#1e3b2b] font-bold">Seller Catalog</h2>
          <p className="text-xs font-medium text-gray-400 mt-1">Showing {products.length} products listed by this vendor</p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:justify-start sm:gap-4 md:gap-5">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-gray-200 bg-white py-16 text-center shadow-sm">
            <PackageOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-950">No products listed</h3>
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">This vendor has not published any products in their catalog yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
