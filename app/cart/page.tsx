'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Scale,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Tag,
  Ticket,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DealCountdownTimer from '@/components/DealCountdownTimer';

const defaultProductImage = '/images/product-card-default.jpg';
function getSafeCartImage(img: any) {
  if (!img || typeof img !== 'string' || img.trim() === '') {
    return defaultProductImage;
  }
  return img;
}

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { status } = useAuth();

  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showOffers, setShowOffers] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(false);

  // Check if any cart items are vendor-specific (ordered from a vendor store page)
  const vendorStoreItem = cart.find((item: any) => item.from_vendor_page && item.vendor_id);
  const currentVendorId = vendorStoreItem ? String(vendorStoreItem.vendor_id) : null;
  const currentVendorName = vendorStoreItem?.vendor_name || 'Seller Store';
  const isVendorOrder = Boolean(currentVendorId);

  // Ensure cart page opens from the top on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  // Fetch available coupons dynamically based on vendor order vs global all-products order
  useEffect(() => {
    let isMounted = true;
    const fetchCoupons = async () => {
      try {
        setLoadingOffers(true);
        const url = isVendorOrder
          ? `/api/v1/coupons?vendor_id=${encodeURIComponent(currentVendorId!)}`
          : `/api/v1/coupons?type=global`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && Array.isArray(json.data)) {
            setAvailableCoupons(json.data);
          }
        }
      } catch (e) {
        console.error('Failed to load coupons:', e);
      } finally {
        if (isMounted) setLoadingOffers(false);
      }
    };
    fetchCoupons();
    return () => { isMounted = false; };
  }, [isVendorOrder, currentVendorId]);

  // Remove incompatible coupon if order type switches
  useEffect(() => {
    if (!appliedCoupon) return;
    if (isVendorOrder && !appliedCoupon.vendor_id) {
      removeCoupon();
      setCouponError('Previous global coupon was removed because your cart contains items from a seller store.');
    } else if (!isVendorOrder && appliedCoupon.vendor_id) {
      removeCoupon();
      setCouponError('Previous seller coupon was removed because your cart is from the general produce catalog.');
    }
  }, [isVendorOrder, appliedCoupon, removeCoupon]);

  const handleApplyCoupon = async (codeToUse?: string) => {
    const code = (codeToUse || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await fetch('/api/v1/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          order_total: cartTotal,
          vendor_id: currentVendorId,
          from_vendor_page: isVendorOrder,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid or inactive coupon code.');
      }
      applyCoupon(data.coupon);
      setCouponInput('');
      setCouponSuccess(`Coupon "${data.coupon.code}" applied! You saved ₹${Number(data.coupon.discount_amount).toFixed(2)}`);
    } catch (err: any) {
      setCouponError(err.message || 'Failed to apply coupon.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponSuccess('');
    setCouponError('');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center text-center px-4 py-12">
        <div className="bg-green-50 p-8 rounded-full mb-6 ring-8 ring-green-50/50">
          <ShoppingBag className="w-16 h-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Your Shopping Cart is Empty</h1>
        <p className="text-gray-500 mb-6 max-w-md text-sm">
          Items you add to your cart for purchase will appear here. If you have already placed an order, it is safely stored and tracked in your Order History!
        </p>

        <div className="flex flex-wrap gap-3.5 justify-center max-w-lg">
          <Link
            href="/profile/orders"
            className="bg-gray-900 hover:bg-black text-white font-extrabold px-6 py-3.5 rounded-2xl transition-all shadow-md text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span>📦 View My Orders & Tracking</span>
          </Link>
          <Link
            href="/products"
            className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-green-100 text-xs sm:text-sm cursor-pointer"
          >
            Browse Retail Produce
          </Link>
          <Link
            href="/bulk-products"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-black px-6 py-3.5 rounded-2xl transition-all shadow-md text-xs sm:text-sm cursor-pointer"
          >
            🌾 Buy in Bulk (5kg+)
          </Link>
        </div>
      </div>
    );
  }

  // Calculate distinct subtotals for retail vs wholesale bulk deals
  const retailItems = cart.filter((item: any) => !item.is_bulk_deal);
  const bulkItems = cart.filter((item: any) => Boolean(item.is_bulk_deal));

  const retailSubtotal = retailItems.reduce((acc: number, item: any) => acc + (Number(item.price || 0) * Number(item.cartQuantity || 1)), 0);
  const bulkSubtotal = bulkItems.reduce((acc: number, item: any) => acc + (Number(item.price || 0) * Number(item.cartQuantity || 1)), 0);

  const couponDiscount = appliedCoupon ? Number(appliedCoupon.discount_amount || 0) : 0;
  const discountedSubtotal = Math.max(0, cartTotal - couponDiscount);
  const deliveryCharge = cartTotal > 0 && cartTotal < 199 ? 40 : 0;
  const finalTotal = discountedSubtotal + deliveryCharge;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-green-600" />
            Your Shopping Cart
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {cart.length} item{cart.length > 1 ? 's' : ''} in cart ({bulkItems.length} wholesale deal{bulkItems.length === 1 ? '' : 's'})
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => clearCart()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition border border-red-200 cursor-pointer"
            title="Empty all items from cart"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Clear Cart</span>
          </button>

          <Link
            href="/bulk-products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-extrabold transition border border-emerald-200"
          >
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Add More Bulk Deals (5kg+)</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">

          {/* Wholesale Bulk Items (if any) */}
          {bulkItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-800 uppercase tracking-wider px-1">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>Negotiated Bulk Wholesale Deals (Min 5 kg)</span>
              </div>

              {bulkItems.map((item: any) => {
                const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.cartQuantity) || 1);
                const isAtMinQty = Number(item.cartQuantity || 0) <= 5;

                return (
                  <div
                    key={item.cartId || item._id}
                    className="bg-gradient-to-br from-emerald-50/80 via-green-50/40 to-white p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row gap-4 sm:items-center border-2 border-emerald-300 shadow-sm relative overflow-hidden"
                  >
                    <div className="relative w-full sm:w-28 h-28 rounded-2xl overflow-hidden shrink-0 bg-white border border-emerald-200">
                      <Image src={getSafeCartImage(item.image)} alt={item.name || 'Product'} fill sizes="(max-width: 640px) 100vw, 112px" unoptimized className="object-cover" />
                      <span className="absolute top-1.5 left-1.5 bg-amber-400 text-gray-950 font-black text-[9px] px-2 py-0.2 rounded uppercase shadow-xs">
                        Min 5 kg
                      </span>
                    </div>

                    <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between w-full">
                      <div className="mb-3 sm:mb-0">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Negotiated Deal
                          </span>
                          {item.deal_token && (
                            <span className="text-[10px] text-gray-500 font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-200">
                              {item.deal_token}
                            </span>
                          )}
                          <DealCountdownTimer variant="compact" />
                        </div>
                        <h3 className="font-extrabold text-gray-900 text-base mt-1">{item.name}</h3>
                        <p className="text-emerald-700 font-extrabold text-sm mt-0.5">
                          Agreed Rate: ₹{Number(item.price || 0).toFixed(2)}/kg
                        </p>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                          Total Bulk Deal Value: <strong className="text-gray-900 font-bold">₹{itemTotal.toFixed(2)}</strong> ({item.cartQuantity} kg)
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <div className="flex items-center bg-white rounded-xl p-1 border border-emerald-200 shadow-xs">
                          <button
                            onClick={() => updateQuantity(item.cartId || item._id, item.cartQuantity - 1)}
                            disabled={isAtMinQty}
                            title={isAtMinQty ? "Minimum bulk order quantity is 5 kg" : "Decrease quantity"}
                            className={`p-2 rounded-lg transition-colors ${isAtMinQty
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
                              }`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-extrabold text-xs text-gray-900">
                            {item.cartQuantity} kg
                          </span>
                          {(() => {
                            const maxStock = typeof item.bulk_stock === 'number' ? item.bulk_stock : (typeof item.stock === 'number' ? item.stock : 999999);
                            const isAtMax = Number(item.cartQuantity || 0) >= maxStock;
                            return (
                              <button
                                onClick={() => updateQuantity(item.cartId || item._id, item.cartQuantity + 1)}
                                disabled={isAtMax}
                                title={isAtMax ? `You cannot order more than the product stock limit (${maxStock} kg available)` : "Increase quantity"}
                                className={`p-2 rounded-lg transition-colors ${isAtMax ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            );
                          })()}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.cartId || item._id)}
                          className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                          title="Remove bulk deal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Regular Retail Produce Items (if any) */}
          {retailItems.length > 0 && (
            <div className="space-y-3 pt-2">
              {bulkItems.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider px-1">
                  <ShoppingBag className="w-4 h-4 text-green-600" />
                  <span>Retail Produce Items</span>
                </div>
              )}

              {retailItems.map((item: any) => {
                const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.cartQuantity) || 1);
                return (
                  <div key={item.cartId || item._id} className="bg-white p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row gap-4 sm:items-center border border-gray-100 shadow-sm relative">
                    <div className="relative w-full sm:w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-gray-50">
                      <Image src={getSafeCartImage(item.image)} alt={item.name || 'Product'} fill sizes="(max-width: 640px) 100vw, 96px" unoptimized className="object-cover" />
                    </div>

                    <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between w-full">
                      <div className="mb-3 sm:mb-0">
                        <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                        <p className="text-green-600 font-bold text-sm mt-0.5">
                          ₹{Number(item.price || 0).toFixed(2)} {item.unit ? `per ${item.unit}` : ''}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Item Total: <strong className="text-gray-900">₹{itemTotal.toFixed(2)}</strong>
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                          <button
                            onClick={() => updateQuantity(item.cartId || item._id, item.cartQuantity - 1)}
                            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 shadow-sm cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-bold text-gray-900 text-xs">{item.cartQuantity}</span>
                          {(() => {
                            const maxStock = typeof item.stock === 'number' ? item.stock : 999999;
                            const isAtMax = Number(item.cartQuantity || 0) >= maxStock;
                            return (
                              <button
                                onClick={() => updateQuantity(item.cartId || item._id, item.cartQuantity + 1)}
                                disabled={isAtMax}
                                title={isAtMax ? `You cannot order more than the product stock limit (${maxStock} available)` : "Increase quantity"}
                                className={`p-2 rounded-lg transition-colors shadow-sm cursor-pointer ${isAtMax ? 'text-gray-300 cursor-not-allowed bg-transparent' : 'text-gray-600 hover:bg-white'}`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            );
                          })()}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.cartId || item._id)}
                          className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Order Summary Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm h-fit sticky top-24 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
            <span className="text-xs text-gray-400 font-semibold">{cart.length} item{cart.length > 1 ? 's' : ''}</span>
          </div>

          {/* ─── Coupon / Promo Code Box ─── */}
          <div className="bg-gray-50/80 border border-gray-200/90 rounded-2xl p-4 space-y-3">
            {appliedCoupon ? (
              <div className="bg-gradient-to-r from-emerald-500/10 via-green-500/15 to-emerald-500/10 border border-emerald-300 rounded-xl p-3 relative transition-all shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-emerald-950 tracking-wider text-xs sm:text-sm">{appliedCoupon.code}</span>
                        <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">Applied</span>
                      </div>
                      <p className="text-xs text-emerald-700 font-bold mt-0.5">
                        Saved ₹{couponDiscount.toFixed(2)} {appliedCoupon.discount_type === 'percent' ? `(${appliedCoupon.discount_value}% OFF)` : 'Flat OFF'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-0.5">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-green-600" />
                    <span>{isVendorOrder ? `${currentVendorName} Promo` : 'Global Promo Code'}</span>
                  </label>
                  {isVendorOrder ? (
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                      🏪 Seller Store
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                      🌐 All Products
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        if (couponError) setCouponError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      placeholder="e.g. FRESH10"
                      className="w-full pl-3 pr-7 py-2 bg-white border border-gray-200 focus:border-green-500 rounded-xl text-xs sm:text-sm font-mono uppercase tracking-wider text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition"
                    />
                    {couponInput && (
                      <button
                        type="button"
                        onClick={() => setCouponInput('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    disabled={!couponInput.trim() || applyingCoupon}
                    className="px-3.5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white disabled:text-gray-400 font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed shrink-0"
                  >
                    {applyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                  </button>
                </div>

                {couponError && (
                  <div className="flex items-start gap-1.5 p-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
                    <span className="font-semibold leading-tight">{couponError}</span>
                  </div>
                )}

                {couponSuccess && (
                  <div className="flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 animate-in fade-in">
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span className="font-bold">{couponSuccess}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Available Offers Dropdown ── */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowOffers(!showOffers)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isVendorOrder
                    ? 'bg-amber-50/80 hover:bg-amber-100/80 border-amber-200 text-amber-950'
                    : 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200 text-emerald-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className={`w-3.5 h-3.5 ${isVendorOrder ? 'text-amber-600' : 'text-emerald-600'}`} />
                  <span>
                    {isVendorOrder
                      ? `Offers from ${currentVendorName} (${availableCoupons.length})`
                      : `Platform Offers (${availableCoupons.length})`}
                  </span>
                </span>
                {showOffers ? (
                  <ChevronUp className={`w-4 h-4 ${isVendorOrder ? 'text-amber-700' : 'text-emerald-700'}`} />
                ) : (
                  <ChevronDown className={`w-4 h-4 ${isVendorOrder ? 'text-amber-700' : 'text-emerald-700'}`} />
                )}
              </button>

              {showOffers && (
                <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {availableCoupons.length === 0 ? (
                    <div className="p-3 bg-white rounded-xl border border-gray-100 text-center text-xs text-gray-500 font-medium">
                      {isVendorOrder
                        ? `No active coupons listed by ${currentVendorName} right now.`
                        : 'No active platform coupons available right now.'}
                    </div>
                  ) : (
                    availableCoupons.map((c) => {
                      const minOrder = Number(c.min_order || 0);
                      const isEligible = cartTotal >= minOrder;
                      const isThisApplied = appliedCoupon?.code === c.code;

                      return (
                        <div
                          key={c._id || c.code}
                          className={`p-2.5 rounded-xl border transition-all text-xs ${
                            isThisApplied
                              ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400'
                              : isEligible
                              ? isVendorOrder
                                ? 'border-dashed border-amber-300 bg-white hover:border-amber-500'
                                : 'border-dashed border-emerald-300 bg-white hover:border-emerald-500'
                              : 'border-dashed border-gray-200 bg-gray-50/80 opacity-70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-black text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 uppercase text-[11px]">
                                {c.code}
                              </span>
                              <span className={`font-bold text-[11px] ${isVendorOrder ? 'text-amber-800' : 'text-emerald-700'}`}>
                                {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT`}
                              </span>
                              {c.vendor_id ? (
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                  🏪 Seller Deal
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                  🌐 All Products
                                </span>
                              )}
                            </div>
                            {isThisApplied ? (
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                                Applied
                              </span>
                            ) : isEligible ? (
                              <button
                                type="button"
                                onClick={() => handleApplyCoupon(c.code)}
                                disabled={applyingCoupon}
                                className={`px-2.5 py-1 text-white font-extrabold text-[10px] rounded-lg transition cursor-pointer shadow-xs ${
                                  isVendorOrder
                                    ? 'bg-amber-600 hover:bg-amber-700'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                              >
                                Apply
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                +₹{(minOrder - cartTotal).toFixed(0)} more
                              </span>
                            )}
                          </div>
                          {minOrder > 0 && (
                            <p className="text-[10px] text-gray-500 mt-1 font-medium">
                              Valid on orders above ₹{minOrder}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Price Breakdown ── */}
          <div className="space-y-2.5 pb-4 border-b border-gray-100 text-xs">
            {/* Separate Subtotals */}
            {retailSubtotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>🛍️ Retail Produce Subtotal</span>
                <span className="font-bold text-gray-900">₹{retailSubtotal.toFixed(2)}</span>
              </div>
            )}

            {bulkSubtotal > 0 && (
              <div className="flex justify-between text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                <span className="font-semibold">🌾 Negotiated Bulk Deals ({bulkItems.length})</span>
                <span className="font-extrabold text-emerald-900">₹{bulkSubtotal.toFixed(2)}</span>
              </div>
            )}

            {appliedCoupon && (
              <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50/80 px-2.5 py-2 rounded-xl border border-emerald-200">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                </span>
                <span className="font-black">-₹{couponDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-gray-600">
              <span>Delivery Charges</span>
              {deliveryCharge > 0 ? (
                <span className="text-gray-900 font-bold">₹{deliveryCharge.toFixed(2)}</span>
              ) : (
                <span className="text-green-600 font-extrabold">FREE</span>
              )}
            </div>
          </div>

          {/* ── Total Payable ── */}
          <div className="flex justify-between items-baseline pt-1">
            <div>
              <span className="text-base font-bold text-gray-900">Total Payable</span>
              {couponDiscount > 0 && (
                <p className="text-[11px] font-extrabold text-emerald-600 mt-0.5">
                  🎉 Saved ₹{couponDiscount.toFixed(2)} with coupon
                </p>
              )}
            </div>
            <div className="text-right">
              {couponDiscount > 0 && (
                <span className="text-xs text-gray-400 line-through mr-2 font-bold">
                  ₹{(cartTotal + deliveryCharge).toFixed(2)}
                </span>
              )}
              <span className="text-2xl font-black text-green-700">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md shadow-green-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
