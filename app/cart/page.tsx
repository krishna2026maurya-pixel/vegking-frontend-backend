'use client';

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Scale, Sparkles, ShieldCheck, RotateCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DealCountdownTimer from '@/components/DealCountdownTimer';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { status } = useAuth();

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

  const deliveryCharge = cartTotal > 0 && cartTotal < 199 ? 40 : 0;
  const finalTotal = cartTotal + deliveryCharge;

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
                      <Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 100vw, 112px" className="object-cover" />
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
                            className={`p-2 rounded-lg transition-colors ${
                              isAtMinQty
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
                            }`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-extrabold text-xs text-gray-900">
                            {item.cartQuantity} kg
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartId || item._id, item.cartQuantity + 1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
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
                      <Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 100vw, 96px" className="object-cover" />
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
                          <button
                            onClick={() => updateQuantity(item.cartId || item._id, item.cartQuantity + 1)}
                            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 shadow-sm cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
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
          <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
          
          <div className="space-y-3 pb-4 border-b border-gray-100">
            {/* Separate Subtotals */}
            {retailSubtotal > 0 && (
              <div className="flex justify-between text-gray-600 text-xs">
                <span>🛍️ Retail Produce Subtotal</span>
                <span className="font-bold text-gray-900">₹{retailSubtotal.toFixed(2)}</span>
              </div>
            )}

            {bulkSubtotal > 0 && (
              <div className="flex justify-between text-emerald-800 text-xs bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                <span className="font-semibold">🌾 Negotiated Bulk Deals ({bulkItems.length})</span>
                <span className="font-extrabold text-emerald-900">₹{bulkSubtotal.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-gray-600 text-xs">
              <span>Delivery Charges</span>
              {deliveryCharge > 0 ? (
                <span className="text-gray-900 font-bold">₹{deliveryCharge.toFixed(2)}</span>
              ) : (
                <span className="text-green-600 font-extrabold">FREE</span>
              )}
            </div>
          </div>

          <div className="flex justify-between items-baseline pt-1">
            <span className="text-base font-bold text-gray-900">Total Payable</span>
            <span className="text-2xl font-black text-green-700">₹{finalTotal.toFixed(2)}</span>
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
