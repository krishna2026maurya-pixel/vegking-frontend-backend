'use client';

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-green-50 p-8 rounded-full mb-6">
          <ShoppingBag className="w-16 h-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8 max-w-md">Looks like you haven&apos;t added any vegetables to your cart yet. Let&apos;s find some fresh picks!</p>
        <Link
          href="/products"
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-green-100"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  const deliveryCharge = cartTotal > 0 && cartTotal < 199 ? 40 : 0;
  const finalTotal = cartTotal + deliveryCharge;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-green-600" />
        Your Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item: any) => (
            <div key={item.cartId || item._id} className="bg-white p-4 sm:p-6 rounded-3xl flex flex-col sm:flex-row gap-4 sm:items-center border border-gray-100 shadow-sm relative">
              <div className="relative w-full sm:w-28 h-32 sm:h-28 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50">
                <Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 100vw, 112px" className="object-cover" />
              </div>

              <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between w-full">
                <div className="mb-4 sm:mb-0">
                  <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                  <p className="text-green-600 font-bold mt-1">₹{Number(item.price || 0).toFixed(2)} {item.unit ? `per ${item.unit}` : ''}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto">
                  <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                    <button
                      onClick={() => updateQuantity(item.cartId || item._id, item.cartQuantity - 1)}
                      className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 shadow-sm border border-transparent hover:border-gray-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-gray-900">{item.cartQuantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cartId || item._id, item.cartQuantity + 1)}
                      className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 shadow-sm border border-transparent hover:border-gray-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.cartId || item._id)}
                    className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors border border-transparent hover:border-red-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm h-fit sticky top-24">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Order Summary</h2>
          <div className="space-y-4 mb-8">
            {/* Individual Items */}
            <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
              {cart.map((item: any) => {
                const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.cartQuantity) || 1);
                return (
                  <div key={item.cartId || item._id} className="flex justify-between text-gray-600 text-sm">
                    <span className="truncate pr-4">
                      {item.name} <span className="text-gray-400 text-xs ml-1">x{item.cartQuantity}</span>
                    </span>
                    <span className="font-medium text-gray-900 flex-shrink-0">₹{itemTotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Delivery</span>
              {deliveryCharge > 0 ? (
                <span className="text-gray-900 font-medium">₹{deliveryCharge.toFixed(2)}</span>
              ) : (
                <span className="text-green-600 font-bold">FREE</span>
              )}
            </div>
            {deliveryCharge > 0 && (
              <p className="text-xs text-gray-400">Add ₹{(199 - cartTotal).toFixed(2)} more for FREE delivery!</p>
            )}
            <div className="h-px bg-gray-100 my-4"></div>
            <div className="flex justify-between text-xl font-bold text-gray-900">
              <span>Total</span>
              <span className="text-green-600">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2 group"
          >
            Checkout
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
