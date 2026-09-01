'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import NegotiationModal from '@/components/NegotiationModal';
import {
  ArrowLeft,
  ShoppingCart,
  CalendarRange,
  Truck,
  ShieldCheck,
  Clock,
  Store,
  CheckCircle,
  MapPin,
  ArrowRight,
  Sparkles,
  Check,
  Plus,
  Minus,
  X,
  MessageSquare,
  Scale,
} from 'lucide-react';

const fallbackImage = '/images/product-card-default.jpg';

export default function ProductDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { addToCart, updateQuantity, cart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgSrc, setImgSrc] = useState(fallbackImage);
  const [qty, setQty] = useState('1 kg');
  const [cartClicked, setCartClicked] = useState(false);
  const [isNegotiateModalOpen, setIsNegotiateModalOpen] = useState(false);

  // Subscription states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subFreq, setSubFreq] = useState('weekly');
  const [subQty, setSubQty] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState('Monday');

  // Other sellers selling same product name
  const [sellers, setSellers] = useState<any[]>([]);

  // Similar products
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [vendorDetails, setVendorDetails] = useState<any>(null);

  // Scroll to top immediately when product ID changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        const item = json.data;

        const isVendorObj = typeof item.vendor_id === 'object' && item.vendor_id !== null;
        const vId = isVendorObj ? item.vendor_id._id : item.vendor_id;
        const vShopName = item.vendor_shop_name || (isVendorObj ? item.vendor_id.shop_name : '') || '';
        const vShopImage = (isVendorObj ? item.vendor_id.shop_image : '') || '';
        const vFullName = (isVendorObj ? item.vendor_id.full_name : '') || '';
        const vIsVerified = (isVendorObj ? item.vendor_id.is_verified : '0') || '0';
        const vLocation = isVendorObj
          ? [item.vendor_id.address, item.vendor_id.city, item.vendor_id.state].filter(Boolean).join(', ') || item.vendor_id.gps_location || ''
          : '';

        // Normalize fields
        const normalized = {
          _id: item._id,
          name: item.product_name || '',
          price: Number(item.selling_price) || Number(item.total_amt) || 0,
          mrp: Number(item.mrp) || 0,
          discount: item.mrp && item.selling_price ? Math.round(((item.mrp - item.selling_price) / item.mrp) * 100) : 0,
          image: item.product_image || (Array.isArray(item.images) ? item.images[0] : '') || fallbackImage,
          description: item.product_description || item.description || 'Fresh farm produce sourced directly from local growers.',
          stock: (item.stock_status !== undefined && item.stock_status !== null && !isNaN(Number(item.stock_status)))
            ? Number(item.stock_status)
            : (item.stock !== undefined && item.stock !== null && !isNaN(Number(item.stock))
              ? Number(item.stock)
              : (item.stock_status === 'in_stock' ? 99 : 0)),
          quantity: item.quantity || '1 kg',
          category: item.category || 'Fresh Produce',
          vendor_id: vId,
          vendor_shop_name: vShopName,
          vendor_shop_image: vShopImage,
          vendor_full_name: vFullName,
          vendor_is_verified: vIsVerified,
          vendor_location: vLocation,
          // Bulk fields
          is_bulk_available: Boolean(item.is_bulk_available),
          bulk_min_qty: Math.max(5, Number(item.bulk_min_qty) || 5),
          bulk_base_price: item.bulk_base_price !== undefined ? Number(item.bulk_base_price) : null,
          bulk_unit: item.bulk_unit || 'kg',
          bulk_stock: item.bulk_stock !== undefined ? Number(item.bulk_stock) : null,
        };

        setProduct(normalized);
        setImgSrc(normalized.image);
        setQty(normalized.quantity);

        if (isVendorObj) {
          setVendorDetails(item.vendor_id);
        }

        // 1. Fetch other sellers with same product name
        const sellersRes = await fetch(`/api/products?search=${encodeURIComponent(normalized.name)}&limit=100`);
        if (sellersRes.ok) {
          const sellersJson = await sellersRes.json();
          const otherSellers = (sellersJson.data || [])
            .filter((p: any) =>
              p.name.toLowerCase() === normalized.name.toLowerCase() &&
              p._id !== normalized._id
            )
            .map((p: any) => ({
              _id: p._id,
              vendor_id: p.vendor_id,
              vendor_name: p.vendor_shop_name || 'Other Seller',
              price: p.price,
              mrp: p.mrp,
              discount: p.discount,
              stock: p.stock,
            }));
          setSellers(otherSellers);
        }

        // 2. Fetch SIMILAR products in the same category / fresh produce
        setSimilarLoading(true);
        try {
          const categoryQuery = normalized.category && normalized.category !== 'Fresh Produce' ? normalized.category : '';
          const [simRes, vInfoRes] = await Promise.all([
            fetch(`/api/products?category=${encodeURIComponent(categoryQuery)}&limit=50`),
            vId && !isVendorObj ? fetch(`/api/vendors/${vId}`) : Promise.resolve(null),
          ]);

          if (simRes.ok) {
            const simJson = await simRes.json();
            const rawProds = Array.isArray(simJson)
              ? simJson
              : Array.isArray(simJson.data)
              ? simJson.data
              : [];

            let filtered = rawProds
              .filter((p: any) => (p._id || p.id) !== normalized._id)
              .map((p: any) => ({
                ...p,
                name: p.name || p.product_name,
                price: p.price || p.selling_price,
                image: p.image || p.product_image,
                discount:
                  p.discount ||
                  p.discount_percent ||
                  (p.mrp && p.selling_price
                    ? Math.round(((p.mrp - p.selling_price) / p.mrp) * 100)
                    : 0),
                stock: (p.stock !== undefined && p.stock !== null && !isNaN(Number(p.stock)))
                  ? Number(p.stock)
                  : (p.stock_status !== undefined && p.stock_status !== null && !isNaN(Number(p.stock_status))
                    ? Number(p.stock_status)
                    : 0),
              }));

            // Fallback if category has very few items: fetch all products
            if (filtered.length < 5) {
              const allRes = await fetch(`/api/products?limit=25`);
              if (allRes.ok) {
                const allJson = await allRes.json();
                const allList = (Array.isArray(allJson.data) ? allJson.data : []).map((p: any) => ({
                  ...p,
                  name: p.name || p.product_name,
                  price: p.price || p.selling_price,
                  image: p.image || p.product_image,
                  discount:
                    p.discount ||
                    p.discount_percent ||
                    (p.mrp && p.selling_price
                      ? Math.round(((p.mrp - p.selling_price) / p.mrp) * 100)
                      : 0),
                  stock: (p.stock !== undefined && p.stock !== null && !isNaN(Number(p.stock)))
                    ? Number(p.stock)
                    : (p.stock_status !== undefined && p.stock_status !== null && !isNaN(Number(p.stock_status))
                      ? Number(p.stock_status)
                      : 0),
                }));
                const extra = allList.filter((p: any) => (p._id || p.id) !== normalized._id && !filtered.some((f: any) => (f._id || f.id) === (p._id || p.id)));
                filtered = [...filtered, ...extra];
              }
            }

            setSimilarProducts(filtered.slice(0, 15));
          }

          if (vInfoRes && vInfoRes.ok) {
            const vInfoJson = await vInfoRes.json();
            setVendorDetails(vInfoJson.data || vInfoJson);
          }
        } catch (e) {
          console.error('Failed to load similar products:', e);
        } finally {
          setSimilarLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    setDeliveryDate(subFreq === 'weekly' ? 'Monday' : '1st of the month');
  }, [subFreq]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex justify-center items-center">
        <div className="w-9 h-9 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-serif font-bold text-red-700 mb-3">{error || 'Product Not Found'}</h2>
        <button onClick={() => router.push('/products')} className="inline-flex items-center gap-2 text-primary font-bold hover:underline text-sm cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>
      </div>
    );
  }

  const inStock = product.stock > 0;
  const pct = product.discount;
  const yourPrice = product.price;
  const mrp = product.mrp;
  const saving = mrp - yourPrice;

  const cartItem = cart?.find((c: any) => (c.cartId || c._id) === product?._id);
  const cartQty = cartItem ? (cartItem.cartQuantity || cartItem.quantity || 0) : 0;

  const vendorName = product.vendor_shop_name || vendorDetails?.shop_name || '';
  const vendorImage = product.vendor_shop_image || vendorDetails?.shop_image || '';
  const isVerified = (product.vendor_is_verified === '1' || vendorDetails?.is_verified === '1');
  const locationText = product.vendor_location || (vendorDetails ? Array.from(new Set([vendorDetails.address, vendorDetails.city, vendorDetails.state].filter(Boolean))).join(', ') || vendorDetails.gps_location : '');

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          quantity: subQty,
          frequency: subFreq,
          deliveryDate: deliveryDate,
          selectedWeight: qty,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Something went wrong');

      const newSubscription = {
        id: data.subscription?._id || Date.now().toString(),
        productId: product._id,
        productName: product.name,
        image: imgSrc,
        size: qty,
        quantity: subQty,
        frequency: subFreq,
        deliveryDate: deliveryDate,
        price: data.chargedAmount ?? Math.round(yourPrice * subQty * (subFreq === 'weekly' ? 0.9 : 0.85)),
        createdAt: new Date().toISOString()
      };

      const existing = JSON.parse(localStorage.getItem('vegking_subscriptions') || '[]');
      existing.push(newSubscription);
      localStorage.setItem('vegking_subscriptions', JSON.stringify(existing));

      alert(`${data.message || `Successfully subscribed to ${product.name}!`} Wallet charged: Rs. ${Number(data.chargedAmount || newSubscription.price).toFixed(2)}.`);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message === 'Insufficient Wallet Balance' ? 'Insufficient Wallet Balance' : `Subscription failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-[85rem] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/products')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 hover:text-green-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── Compact Main Product Card ──────────────────────────────── */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 bg-white border border-gray-100/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
        {/* Left: Product Image */}
        <div className="flex items-center justify-center bg-gray-50/70 rounded-xl sm:rounded-2xl p-4 relative aspect-square max-h-[300px] sm:max-h-[340px] mx-auto w-full border border-gray-100">
          {pct > 0 && (
            <span className="absolute top-3 left-3 z-10 rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-xs">
              {pct}% OFF
            </span>
          )}
          <img
            src={imgSrc}
            alt={product.name}
            className="max-h-[240px] sm:max-h-[270px] w-full object-contain transition-transform duration-300 hover:scale-105"
            onError={() => setImgSrc(fallbackImage)}
          />
        </div>

        {/* Right: Product Details (Compact, No 'Sold by' on product) */}
        <div className="flex flex-col gap-3 justify-center">
          <div>
            <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-0.5">
              {product.category || 'Fresh Produce'}
            </p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-gray-900 leading-snug">
              {product.name}
            </h1>
          </div>

          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">₹{yourPrice}</span>
            {mrp > yourPrice && (
              <>
                <span className="text-base sm:text-lg text-gray-400 line-through">₹{mrp}</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                  Save ₹{saving} ({pct}% off)
                </span>
              </>
            )}
          </div>

          <div className="border-y border-gray-100 py-2.5 flex flex-col gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-700 w-20 sm:w-24">Pack Size:</span>
              <span className="font-semibold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md">{qty}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-700 w-20 sm:w-24">Availability:</span>
              <span className={`font-bold ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                {inStock ? '● In Stock (Farm Fresh)' : '● Out of Stock'}
              </span>
            </div>
          </div>

          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3 sm:line-clamp-none">
            {product.description}
          </p>

          {/* Action Buttons (Add to Cart & Subscribe & Save - Equal Width) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {/* Add to Cart / In-Cart Stepper */}
            {cartQty > 0 ? (
              <div className="w-full bg-gradient-to-r from-[#0c831f] to-[#15803d] text-white flex items-center justify-between rounded-2xl px-4 py-2 sm:py-2.5 shadow-md shadow-green-700/25 h-[50px] border border-green-600/40">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(product._id, cartQty - 1, e);
                  }}
                  className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-white hover:scale-110 active:scale-90 transition cursor-pointer"
                  title="Decrease quantity"
                >
                  <Minus className="w-4 h-4" strokeWidth={3} />
                </button>
                <div className="flex items-center gap-1.5 select-none text-center">
                  <ShoppingCart className="w-4 h-4 text-green-200 animate-scale-in" strokeWidth={2.5} />
                  <span className="font-black text-sm sm:text-base tracking-tight">{cartQty} in Cart</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(product._id, cartQty + 1, e);
                  }}
                  className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-white hover:scale-110 active:scale-90 transition cursor-pointer"
                  title="Increase quantity"
                >
                  <Plus className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  addToCart({ ...product, qty, price: yourPrice }, e);
                  setCartClicked(true);
                  setTimeout(() => setCartClicked(false), 600);
                }}
                disabled={!inStock}
                className={`w-full relative group inline-flex items-center justify-center gap-2 py-3 sm:py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer h-[50px] overflow-hidden ${
                  inStock
                    ? 'bg-gradient-to-r from-[#16a34a] via-[#15803d] to-[#047857] hover:from-[#15803d] hover:to-[#065f46] text-white shadow-green-600/30 hover:shadow-lg hover:shadow-green-600/40 border border-green-500/30'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed border-none shadow-none'
                }`}
              >
                {inStock ? (
                  <>
                    {cartClicked ? (
                      <span className="inline-flex items-center gap-1.5 animate-scale-in text-white">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                        <span>Added to Cart!</span>
                      </span>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 transition-transform duration-200 group-hover:scale-115" strokeWidth={2.5} />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </>
                ) : (
                  'Out of Stock'
                )}
              </button>
            )}

            {/* Subscribe & Save Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={!inStock}
              className={`w-full relative group inline-flex items-center justify-center gap-2 py-3 sm:py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 border-2 shadow-xs active:scale-[0.98] cursor-pointer h-[50px] overflow-hidden ${
                inStock
                  ? 'border-emerald-600/40 bg-gradient-to-r from-emerald-50/95 via-green-50/80 to-teal-50/70 hover:from-emerald-100 hover:to-green-100/90 text-emerald-950 hover:border-emerald-600/70 shadow-emerald-700/5'
                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              <CalendarRange className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" strokeWidth={2.3} />
              <span>Subscribe & Save</span>
            </button>
          </div>

          {/* Bulk / Wholesale Negotiation Card */}
          <div className="p-4 bg-gradient-to-br from-amber-500/10 via-green-500/10 to-emerald-500/10 border border-amber-300/60 dark:border-amber-700/60 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span>Wholesale & Bulk Inquiries</span>
                </div>
                <span className="bg-amber-400 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Min {product?.bulk_min_qty || 5} {product?.bulk_unit || 'kg'}
                </span>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300">
                Buying for commercial, restaurant, or family bulk use? Chat directly with <strong>{product?.vendor_shop_name || 'Vendor'}</strong> to bargain custom rate & delivery.
              </p>

              {product?.bulk_base_price && (
                <div className="flex items-center justify-between text-xs pt-1 font-semibold">
                  <span className="text-gray-500">Base Wholesale Rate:</span>
                  <span className="text-green-700 dark:text-green-400 font-extrabold text-sm">
                    ₹{product.bulk_base_price}/{product.bulk_unit || 'kg'}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsNegotiateModalOpen(true)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-gray-950" />
                <span>Negotiate Price with Vendor</span>
              </button>
            </div>

          {/* Delivery & Trust Badges */}
          <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center text-[10px] sm:text-[11px] font-bold text-gray-500">
            <div className="flex flex-col items-center gap-1">
              <Truck className="w-4 h-4 text-primary" />
              <span>Next Day Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>100% Organic</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock className="w-4 h-4 text-primary" />
              <span>Direct Farm Pick</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Negotiation Modal */}
      <NegotiationModal
        isOpen={isNegotiateModalOpen}
        onClose={() => setIsNegotiateModalOpen(false)}
        product={product}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── Similar Products Section (Responsive) ──────────────────── */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3 sm:space-y-4 pt-1">
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5 sm:pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1e3b2b]">
              Similar Products
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Explore freshly harvested produce and essentials you might also like.
            </p>
          </div>

          <Link
            href="/products"
            className="text-xs font-bold text-green-700 hover:text-green-900 inline-flex items-center gap-1 hover:underline self-start sm:self-auto"
          >
            <span>View all products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Similar Products Grid (Responsive: 2-col mobile, 3-col tablet, 4-5 col desktop) */}
        {similarLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : similarProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
            {similarProducts.map((p) => (
              <ProductCard key={p._id || p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center space-y-2">
            <Sparkles className="mx-auto h-7 w-7 text-gray-300" />
            <h3 className="text-sm font-bold text-gray-800">
              Explore more fresh arrivals
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Browse our complete catalog to find farm-fresh fruits, vegetables, and organics.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs font-bold text-green-700 hover:underline pt-1"
            >
              <span>Browse catalog</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Bottom Seller Information & 'See More from Seller' bar */}
        {vendorName && product.vendor_id && (
          <div className="mt-4 sm:mt-5 bg-gradient-to-r from-green-50/80 via-emerald-50/40 to-white border border-green-100/90 rounded-2xl p-3.5 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white border border-green-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {vendorImage ? (
                  <img src={vendorImage} alt={vendorName} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-5 h-5 text-green-700" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-gray-900">{vendorName}</span>
                  {isVerified && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-green-100 text-green-800 px-1.5 py-0.2 rounded-full">
                      <CheckCircle className="w-2.5 h-2.5" /> Verified
                    </span>
                  )}
                </div>
                {locationText && (
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate max-w-xs sm:max-w-md">
                    <MapPin className="w-3 h-3 text-green-600 shrink-0" />
                    <span className="truncate">{locationText}</span>
                  </p>
                )}
              </div>
            </div>

            <Link
              href={`/vendors/${product.vendor_id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-2xs hover:shadow-xs shrink-0"
            >
              <span>See More from this Seller</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── Other Sellers for this Exact Item ──────────────────────── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {sellers.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="border-b border-gray-100 pb-2.5">
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#1e3b2b]">Other Sellers for this Item</h2>
            <p className="text-xs text-gray-500 mt-0.5">This product is also sold by other verified local sellers</p>
          </div>
          <div className="divide-y divide-gray-50">
            {sellers.map((seller) => (
              <div key={seller._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">{seller.vendor_name}</h3>
                  <p className="text-[11px] font-semibold text-gray-400 mt-0.5">Price: ₹{seller.price}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-extrabold text-gray-900">₹{seller.price}</span>
                    {seller.mrp > seller.price && (
                      <div className="text-[10px] font-bold text-green-600">₹{seller.mrp - seller.price} off</div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      addToCart({
                        _id: seller._id,
                        name: product.name,
                        price: seller.price,
                        mrp: seller.mrp,
                        discount: seller.discount,
                        image: product.image,
                        description: product.description,
                        stock: seller.stock,
                        quantity: product.quantity,
                      }, e);
                      alert(`Added item from "${seller.vendor_name}" to cart!`);
                    }}
                    className="bg-primary text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl hover:bg-primary-hover transition cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── Centered Popup Modal (Appears upon the screen/text) ─────── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full relative flex flex-col gap-4 border border-gray-100 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 font-bold transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-black px-2.5 py-1 rounded-full">
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Wholesale Subscription</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900 leading-tight">
                Subscribe & Save
              </h3>
              <p className="text-xs text-gray-500">
                Scheduled fresh farm deliveries of <span className="font-semibold text-gray-800">{product.name}</span>
              </p>
            </div>

            {/* Product preview snippet */}
            <div className="flex items-center gap-3 bg-gray-50/80 border border-gray-100 rounded-2xl p-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
                <img src={imgSrc} alt={product.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-extrabold text-gray-900 truncate">{product.name}</div>
                <div className="text-[11px] text-gray-500">Pack Size: {qty}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-extrabold text-gray-900">₹{yourPrice}</div>
                <div className="text-[10px] text-green-600 font-semibold">per pack</div>
              </div>
            </div>

            {/* Frequency Toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                Delivery Frequency
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSubFreq('weekly')}
                  className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                    subFreq === 'weekly'
                      ? 'border-green-600 bg-green-50/70 text-green-800 font-black shadow-xs'
                      : 'border-gray-200 bg-white text-gray-600 font-semibold hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-bold">Weekly</div>
                  <div className="text-[10px] text-green-600 font-extrabold mt-0.5">Save 10% Extra</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSubFreq('monthly')}
                  className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                    subFreq === 'monthly'
                      ? 'border-green-600 bg-green-50/70 text-green-800 font-black shadow-xs'
                      : 'border-gray-200 bg-white text-gray-600 font-semibold hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-bold">Monthly</div>
                  <div className="text-[10px] text-green-600 font-extrabold mt-0.5">Save 15% Extra</div>
                </button>
              </div>
            </div>

            {/* Preferred Delivery Day & Quantity Packs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                  Delivery Day
                </label>
                <select
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full p-2.5 text-xs font-semibold border border-gray-200 rounded-xl bg-gray-50 text-gray-800 outline-none cursor-pointer focus:border-green-600 focus:bg-white"
                >
                  {subFreq === 'weekly' ? (
                    <>
                      <option value="Monday">Every Monday</option>
                      <option value="Wednesday">Every Wednesday</option>
                      <option value="Friday">Every Friday</option>
                    </>
                  ) : (
                    <>
                      <option value="1st of the month">1st of month</option>
                      <option value="10th of the month">10th of month</option>
                      <option value="20th of the month">20th of month</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                  Quantity Packs
                </label>
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-1 h-[38px]">
                  <button
                    type="button"
                    onClick={() => setSubQty((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-lg bg-white shadow-xs font-black text-xs text-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="text-xs font-black text-gray-900">{subQty} pack{subQty > 1 ? 's' : ''}</span>
                  <button
                    type="button"
                    onClick={() => setSubQty((q) => q + 1)}
                    className="w-7 h-7 rounded-lg bg-white shadow-xs font-black text-xs text-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-3 text-xs space-y-1.5 text-gray-600">
              <div className="flex justify-between">
                <span>Base Price ({subQty} × ₹{yourPrice}):</span>
                <span>₹{yourPrice * subQty}</span>
              </div>
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Subscription Discount ({subFreq === 'weekly' ? '10%' : '15%'}):</span>
                <span>-₹{Math.round(yourPrice * subQty * (subFreq === 'weekly' ? 0.1 : 0.15))}</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-1.5 flex justify-between font-black text-gray-900 text-sm">
                <span>Recurring Total:</span>
                <span className="text-green-700">₹{Math.round(yourPrice * subQty * (subFreq === 'weekly' ? 0.9 : 0.85))} <span className="text-[10px] font-normal text-gray-500">/{subFreq === 'weekly' ? 'wk' : 'mo'}</span></span>
              </div>
            </div>

            {/* Action CTA */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSubscribe}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-green-600/25 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Subscription</span>
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
