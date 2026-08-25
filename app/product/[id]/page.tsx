'use client';

import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { ArrowLeft, Check, PackageSearch, ShieldCheck, Truck } from 'lucide-react';
=======
import { useParams, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
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
} from 'lucide-react';
>>>>>>> 03f5774 (product status verified)

export default function ProductDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const { addToCart } = useCart();

<<<<<<< HEAD
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
=======
export default function ProductDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { addToCart, updateQuantity, cart } = useCart();
>>>>>>> 03f5774 (product status verified)

    useEffect(() => {
        if (!id) return;
        const fetchProduct = async () => {
            try {
                setLoading(true);
                // As per user request, we use the v1 products API 
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                const data = await res.json();

<<<<<<< HEAD
                if (!data.success) {
                    throw new Error(data.error || 'Failed to fetch product details.');
                }

                setProduct(data.data);
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
=======
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
          stock: item.stock_status === 1 || item.stock_status === '1' ? 99 : 0,
          quantity: item.quantity || '1 kg',
          category: item.category || 'Fresh Produce',
          vendor_id: vId,
          vendor_shop_name: vShopName,
          vendor_shop_image: vShopImage,
          vendor_full_name: vFullName,
          vendor_is_verified: vIsVerified,
          vendor_location: vLocation,
>>>>>>> 03f5774 (product status verified)
        };
        fetchProduct();
    }, [id]);

<<<<<<< HEAD
    const handleAddToCart = () => {
        if (!product) return;
        // Mapping v1 API fields to what CartContext might expect
        addToCart({
            _id: product._id,
            name: product.product_name,
            price: product.selling_price,
            image: product.product_image,
            qty: quantity // quantity to add
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
=======
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
                stock: p.stock || p.stock_status || (p.in_stock ? 100 : 0),
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
                  stock: p.stock || p.stock_status || (p.in_stock ? 100 : 0),
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
>>>>>>> 03f5774 (product status verified)
    };

<<<<<<< HEAD
    if (loading) {
        return (
            <div className="min-h-[70vh] flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
=======
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
>>>>>>> 03f5774 (product status verified)
    }

<<<<<<< HEAD
    if (error || !product) {
        return (
            <div className="min-h-[70vh] flex flex-col justify-center items-center px-4 text-center">
                <PackageSearch className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
                <p className="text-gray-500 max-w-md">{error || 'This product might have been removed or is currently unavailable.'}</p>
                <Link href="/products" className="mt-6 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition">
                    Browse All Products
                </Link>
            </div>
        );
    }

    // Prepare similar products for the ProductCard component which expects a specific mapping
    const mappedSimilarProducts = (product.similar_products || []).map((sp: any) => ({
        _id: sp._id,
        name: sp.product_name,
        price: sp.selling_price,
        discount: sp.mrp && sp.selling_price ? ((sp.mrp - sp.selling_price) / sp.mrp * 100).toFixed(1) : 0,
        image: sp.product_image,
        stock: sp.stock_status,
        weightOptions: [] // Assuming standard vegetables
    }));

    return (
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
            <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-green-600 transition mb-8 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Products
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                {/* Image Section */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="aspect-square bg-gray-50 rounded-3xl border border-gray-100 p-8 flex items-center justify-center relative overflow-hidden group">
                        {product.discount_percent > 0 && (
                            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg z-10 shadow-sm">
                                {product.discount_percent}% OFF
                            </div>
                        )}
                        <img
                            src={product.product_image || '/images/product-card-default.jpg'}
                            alt={product.product_name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
                            onError={(e) => { e.currentTarget.src = '/images/product-card-default.jpg'; }}
                        />
                    </div>
                </div>

                {/* Details Section */}
                <div className="lg:col-span-7 flex flex-col">
                    <div className="mb-2">
                        {product.brand && (
                            <span className="text-sm font-bold tracking-widest text-green-600 uppercase mb-2 block">{product.brand}</span>
                        )}
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                            {product.product_name}
                        </h1>

                        <div className="flex items-center gap-3 mb-6">
                            {product.in_stock ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    In Stock
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-semibold border border-red-200">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    Out of Stock
                                </span>
                            )}
                            {product.category && (
                                <span className="text-gray-400 text-sm">| &nbsp; {product.category}</span>
                            )}
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 bg-gray-50/50 rounded-3xl border border-gray-100 mb-8">
                        <div className="flex flex-wrap items-baseline gap-4 mb-2">
                            <span className="text-4xl font-black text-gray-900">₹{product.selling_price}</span>
                            {product.mrp && product.mrp > product.selling_price && (
                                <>
                                    <span className="text-lg text-gray-400 font-medium line-through decoration-gray-300">₹{product.mrp}</span>
                                    <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">Save ₹{product.saving_amount}</span>
                                </>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Inclusive of all taxes</p>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white h-14">
                                <button
                                    className="px-5 text-gray-500 hover:text-green-600 text-xl font-medium transition"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    -
                                </button>
                                <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                                <button
                                    className="px-5 text-gray-500 hover:text-green-600 text-xl font-medium transition"
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    +
                                </button>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={!product.in_stock}
                                className={`flex-1 h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${!product.in_stock
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : added
                                            ? 'bg-green-700 text-white scale-[0.98]'
                                            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/30 hover:-translate-y-0.5'
                                    }`}
                            >
                                {added ? (
                                    <><Check className="w-5 h-5" /> Added to Cart</>
                                ) : (
                                    <>{product.in_stock ? 'Add to Cart' : 'Out of Stock'}</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Features list */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Truck className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Fast Delivery</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Quality Assured</span>
                        </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="mt-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">About this product</h3>
                            <div
                                className="prose prose-green max-w-none text-gray-600 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Similar Products */}
            {mappedSimilarProducts.length > 0 && (
                <div className="mt-24">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Similar Products</h2>
                        <Link href="/products" className="text-green-600 font-semibold hover:text-green-700">View All</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
                        {mappedSimilarProducts.map((sp: any) => (
                            <ProductCard key={sp._id} product={sp} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
=======
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
>>>>>>> 03f5774 (product status verified)
}
