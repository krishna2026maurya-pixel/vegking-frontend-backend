'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { Heart, Clock, Plus, Minus, Repeat, ArrowLeft, Check } from 'lucide-react';

const fallbackImage = '/images/product-card-default.jpg';

/* ── quantity options per vegetables type ─────────────────────── */
const quantityOptions = {
  cabbage: ['400-500 g', '800 g-1 kg'],
  tomato: ['500 g', '1 kg', '2 kg'],
  spinach: ['1 Bunch', '2 Bunch'],
  carrot: ['500 g', '1 kg'],
  eggplant: ['500 g', '1 kg'],
  pepper: ['250 g', '500 g'],
  broccoli: ['1 Piece', '2 Piece'],
  onion: ['500 g', '1 kg', '2 kg'],
  potato: ['500 g', '1 kg', '2 kg'],
  cauliflower: ['1 Piece', '2 Piece'],
  arhar: ['500 g', '1 kg', '2 kg'],
  chilli: ['100 g', '250 g'],
  ginger: ['100 g', '250 g'],
};

const defaultOptions = ['250 g', '500 g', '1 kg'];

/* ── helpers ─────────────────────────────────────────────────── */
function getVegetableType(name: any) {
  if (!name) return null;
  const v = name.toLowerCase();
  if (v.includes('tomato')) return 'tomato';
  if (v.includes('cabbage')) return 'cabbage';
  if (v.includes('spinach')) return 'spinach';
  if (v.includes('carrot')) return 'carrot';
  if (v.includes('eggplant') || v.includes('brinjal')) return 'eggplant';
  if (v.includes('pepper') || v.includes('capsicum')) return 'pepper';
  if (v.includes('broccoli')) return 'broccoli';
  if (v.includes('onion')) return 'onion';
  if (v.includes('potato')) return 'potato';
  if (v.includes('cauliflower')) return 'cauliflower';
  if (v.includes('arhar') || v.includes('toor dal')) return 'arhar';
  if (v.includes('chilli') || v.includes('chili')) return 'chilli';
  if (v.includes('ginger')) return 'ginger';
  return null;
}

function getQuantityOptions(name: any) {
  const type = getVegetableType(name);
  return type ? quantityOptions[type] : defaultOptions;
}

function parseQuantityRatio(qtyStr: any, baseQtyStr: any) {
  if (!qtyStr || !baseQtyStr) return 1;
  const parseToGrams = (s: any) => {
    const match = s.match(/(\d+)\s*(kg|g|piece|bunch)/i);
    if (!match) return null;
    let val = parseFloat(match[1]);
    let unit = match[2].toLowerCase();
    if (unit === 'kg') return val * 1000;
    return val;
  };
  const q1 = parseToGrams(qtyStr);
  const qBase = parseToGrams(baseQtyStr);
  if (q1 && qBase) {
    return q1 / qBase;
  }
  return 1;
}

/* Derive MRP from the stored selling price + discount saved on the product */
function calcPrices(price: any, discountPct: any) {
  const pct = Number(discountPct) || 0;
  const yourPrice = Number(price) || 0;
  if (pct <= 0) return { yourPrice, mrp: null, saving: 0, pct: 0 };
  const mrp = Math.round(yourPrice / (1 - pct / 100));
  const saving = mrp - yourPrice;
  return { yourPrice, mrp, saving, pct };
}

const getSafeImage = (url: any) => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallbackImage;
  }
  return url;
};

/* ── component ───────────────────────────────────────────────── */
export default function ProductCard({ product }: { product: any }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const [imgSrc, setImgSrc] = useState(getSafeImage(product?.image));
  const [isWishlisted, setIsWishlisted] = useState(false);

  const hasWeightOptions = product?.weightOptions && product.weightOptions.length > 0;
  const options = hasWeightOptions
    ? product.weightOptions.map((opt: any) => opt.weight)
    : getQuantityOptions(product?.name || '');

  const [qty, setQty] = useState(options[0] || '1 unit');

  const selectedOption = hasWeightOptions ? product.weightOptions.find((opt: any) => opt.weight === qty) : null;
  const multiplier = !hasWeightOptions ? parseQuantityRatio(qty, options[0]) : 1;
  const currentBasePrice = selectedOption ? selectedOption.price : Math.round((product?.price || 0) * multiplier);

  const { yourPrice, mrp, pct } = calcPrices(currentBasePrice, product?.discount);
  const stockCount = typeof product?.stock === 'number'
    ? product.stock
    : (product?.stock !== undefined && product?.stock !== null && !isNaN(Number(product.stock)))
      ? Number(product.stock)
      : 0;
  const inStock = stockCount > 0 && product?.stock_status !== 0 && product?.stock_status !== '0';

  // Cart quantity for this item
  const cartItem = cart?.find((c: any) => (c.cartId || c._id) === product?._id);
  const cartQty = cartItem ? (cartItem.cartQuantity || cartItem.quantity || 0) : 0;

  // In-Card Subscription states (Desktop view)
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subFreq, setSubFreq] = useState<'weekly' | 'monthly'>('weekly');
  const [subQty, setSubQty] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState('Monday');
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);

  useEffect(() => {
    setDeliveryDate(subFreq === 'weekly' ? 'Monday' : '1st of the month');
  }, [subFreq]);

  useEffect(() => {
    setImgSrc(product?.image || fallbackImage);
  }, [product?.image]);

  const recurringPrice = Math.round(
    yourPrice * subQty * (subFreq === 'weekly' ? 0.9 : 0.85)
  );

  const handleSubscribe = async () => {
    try {
      setIsSubmittingSub(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/subscription/create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: subQty,
          frequency: subFreq,
          deliveryDate: deliveryDate,
          selectedWeight: qty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Save locally as well
      const newSubscription = {
        id: data.subscription?._id || Date.now().toString(),
        productId: product._id,
        productName: product.name,
        image: imgSrc,
        size: qty,
        quantity: subQty,
        frequency: subFreq,
        deliveryDate: deliveryDate,
        price: data.chargedAmount ?? recurringPrice,
        createdAt: new Date().toISOString()
      };

      const existing = JSON.parse(localStorage.getItem('vegking_subscriptions') || '[]');
      existing.push(newSubscription);
      localStorage.setItem('vegking_subscriptions', JSON.stringify(existing));

      alert(`${data.message || `Successfully subscribed to ${product.name}!`} Wallet charged: Rs. ${Number(data.chargedAmount || newSubscription.price).toFixed(2)}.`);
      setIsSubscribing(false);
    } catch (err: any) {
      alert(err.message === 'Insufficient Wallet Balance' ? 'Insufficient Wallet Balance' : `Subscription failed: ${err.message}`);
    } finally {
      setIsSubmittingSub(false);
    }
  };

  const isTrending = product?.is_bestseller === '1' || product?.is_bestseller === true;

  return (
    <>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── 1. MOBILE VIEW (3-Column Clean Card matching Screenshot) ─ */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="sm:hidden relative bg-white rounded-2xl p-1.5 flex flex-col justify-between w-full h-full shadow-xs fade-in border border-gray-100/60">
        {/* Product Image Square */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
          <Link href={`/product/${product?._id}`} className="block w-full h-full">
            <img
              src={imgSrc}
              alt={product?.name || 'Product'}
              className="w-full h-full object-cover"
              onError={() => setImgSrc(fallbackImage)}
            />
          </Link>

          {/* Trending Tag */}
          {isTrending && (
            <div className="absolute top-1 left-1 bg-[#00c853] text-white text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-xs">
              TRENDING
            </div>
          )}

          {/* Top Right Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
            className="absolute top-1 right-1 text-gray-400 hover:text-red-500 p-1 bg-white/75 backdrop-blur-xs rounded-full shadow-2xs cursor-pointer"
          >
            <Heart
              className={`w-3 h-3 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'
                }`}
            />
          </button>

          {/* Bottom Right Circular Green Plus / Stepper Button */}
          <div className="absolute bottom-1 right-1 z-10">
            {cartQty > 0 ? (
              <div className="bg-[#16a34a] text-white flex items-center justify-between rounded-full px-1.5 py-0.5 gap-1 shadow-md h-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateQuantity(product?._id, cartQty - 1, e);
                  }}
                  className="font-black text-xs p-0.5 active:scale-75 cursor-pointer"
                >
                  <Minus className="w-2.5 h-2.5" strokeWidth={3} />
                </button>
                <span className="font-extrabold text-[10px] select-none px-0.5">{cartQty}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateQuantity(product?._id, cartQty + 1, e);
                  }}
                  className="font-black text-xs p-0.5 active:scale-75 cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" strokeWidth={3} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (inStock) {
                    addToCart({ ...product, qty, price: yourPrice }, e);
                  }
                }}
                disabled={!inStock}
                className="w-6.5 h-6.5 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer disabled:bg-gray-300"
                title="Add to cart"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.8} />
              </button>
            )}
          </div>
        </div>

        {/* Content Section below image */}
        <div className="flex flex-col flex-1 mt-1 px-0.5 justify-between">
          <div>
            {/* Weight/Unit & Stock Badge */}
            <div className="flex items-center justify-between gap-1">
              <span className="text-gray-400 text-[10px] font-semibold truncate">
                {qty}
              </span>
              {stockCount > 0 && (
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded shrink-0">
                  {stockCount} in stock
                </span>
              )}
            </div>

            {/* Product Name */}
            <Link
              href={`/product/${product?._id}`}
              className="block text-gray-900 font-extrabold text-[11px] tracking-tight leading-tight mt-0.5 line-clamp-2 hover:text-green-700 min-h-[26px]"
            >
              {product?.name}
            </Link>
          </div>

          <div>
            {/* Discount label */}
            {pct > 0 && (
              <span className="text-[#00c853] text-[10px] font-bold block mt-0.5">
                {pct}% OFF
              </span>
            )}

            {/* Price Row */}
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span className="text-gray-900 text-xs font-black">
                ₹{yourPrice}
              </span>
              {mrp !== null && pct > 0 && (
                <span className="text-gray-400 text-[9px] line-through">
                  ₹{mrp}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── 2. DESKTOP VIEW (Rich Quick-Commerce Card) ─────────────── */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="hidden sm:flex group relative bg-white border border-gray-200/90 rounded-2xl px-4 py-3.5 flex-col justify-between hover:shadow-md hover:border-gray-300 transition-all duration-200 w-full h-full min-h-[380px] overflow-hidden">
        {isSubscribing ? (
          /* In-Card Subscription View */
          <div className="flex flex-col justify-between h-full space-y-2.5 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <button
                  type="button"
                  onClick={() => setIsSubscribing(false)}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <span className="text-[11px] font-black text-green-700 uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded-full">
                  Subscription
                </span>
              </div>

              <h4 className="text-xs font-black text-gray-900 mt-2 line-clamp-1">
                {product?.name}
              </h4>
              <p className="text-[10px] text-gray-500">Pack: {qty}</p>
            </div>

            <div className="space-y-2.5 flex-1">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Frequency
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSubFreq('weekly')}
                    className={`p-1.5 rounded-xl border text-center cursor-pointer transition-all ${subFreq === 'weekly'
                      ? 'border-green-600 bg-green-50 text-green-800 font-bold shadow-2xs'
                      : 'border-gray-200 text-gray-600 font-medium hover:bg-gray-50'
                      }`}
                  >
                    <div className="text-xs">Weekly</div>
                    <div className="text-[9px] text-green-600 font-semibold">Save 10%</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubFreq('monthly')}
                    className={`p-1.5 rounded-xl border text-center cursor-pointer transition-all ${subFreq === 'monthly'
                      ? 'border-green-600 bg-green-50 text-green-800 font-bold shadow-2xs'
                      : 'border-gray-200 text-gray-600 font-medium hover:bg-gray-50'
                      }`}
                  >
                    <div className="text-xs">Monthly</div>
                    <div className="text-[9px] text-green-600 font-semibold">Save 15%</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Delivery Day
                </label>
                <select
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-1.5 bg-gray-50 text-gray-800 outline-none cursor-pointer"
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

              <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 block">Packs</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setSubQty((q) => Math.max(1, q - 1))}
                      className="w-5 h-5 rounded bg-white font-bold text-xs shadow-2xs border border-gray-200 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-black text-gray-900 px-1">{subQty}</span>
                    <button
                      type="button"
                      onClick={() => setSubQty((q) => q + 1)}
                      className="w-5 h-5 rounded bg-white font-bold text-xs shadow-2xs border border-gray-200 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 line-through block">
                    ₹{yourPrice * subQty}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-green-700">
                    ₹{recurringPrice}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={isSubmittingSub}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:bg-gray-300"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmittingSub ? 'Subscribing...' : 'Confirm Subscription'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSubscribing(false)}
                className="w-full py-1 text-[11px] font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Standard Desktop Card View */
          <>
            {/* Top Left Discount Tag */}
            {pct > 0 && (
              <div className="absolute top-2 left-2 z-10 bg-[#256fee] text-white text-[10px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs tracking-wider">
                {pct}% OFF
              </div>
            )}

            {/* Top Right Wishlist */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsWishlisted(!isWishlisted);
                }}
                className="text-gray-400 hover:text-red-500 p-1 bg-white/90 backdrop-blur-xs rounded-full shadow-2xs transition-colors cursor-pointer"
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'
                    }`}
                />
              </button>
            </div>

            {/* Product Image */}
            <div>
              <Link
                href={`/product/${product?._id}`}
                className="relative w-full h-44 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center block"
              >
                <img
                  src={imgSrc}
                  alt={product?.name || 'Product'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => setImgSrc(fallbackImage)}
                />
              </Link>

              {/* Delivery Time & Live Stock Pill */}
              <div className="mt-1.5 flex items-center justify-between gap-1 w-full">
                <div className="flex items-center gap-1 bg-gray-100/90 text-gray-600 text-[11px] font-bold px-1.5 py-0.5 rounded w-fit">
                  <Clock className="w-3 h-3 text-gray-500" strokeWidth={2.5} />
                  <span>8 MINS</span>
                </div>
                {stockCount > 0 ? (
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                    {stockCount} in stock
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    Out of stock
                  </span>
                )}
              </div>

              {/* Product Title */}
              <Link href={`/product/${product?._id}`} className="mt-1 block">
                <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight hover:text-green-700 transition-colors min-h-[36px]">
                  {product?.name}
                </h3>
              </Link>

              {/* Pack Size / Weight Dropdown */}
              <div className="mt-0.5">
                {options.length > 1 ? (
                  <select
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="text-xs text-gray-500 bg-transparent border-none outline-none font-medium cursor-pointer p-0 hover:text-gray-800"
                  >
                    {options.map((o: any) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-gray-500 font-medium block truncate">
                    {qty}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black text-gray-900">
                    ₹{yourPrice}
                  </span>
                  {mrp !== null && pct > 0 && (
                    <span className="text-xs text-gray-400 line-through">
                      ₹{mrp}
                    </span>
                  )}
                </div>
                {pct > 0 && (
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                    {pct}% OFF
                  </span>
                )}
              </div>

              {/* Full Add to Cart Button */}
              {cartQty > 0 ? (
                <div className="w-full bg-[#0c831f] text-white flex items-center justify-between rounded-xl px-3 py-2 shadow-xs h-9">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateQuantity(product?._id, cartQty - 1, e);
                    }}
                    className="font-black text-base hover:scale-110 active:scale-90 transition-transform p-0.5 cursor-pointer"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>
                  <span className="font-extrabold text-sm select-none">
                    {cartQty} in cart
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateQuantity(product?._id, cartQty + 1, e);
                    }}
                    className="font-black text-base hover:scale-110 active:scale-90 transition-transform p-0.5 cursor-pointer"
                    title="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (inStock) {
                      addToCart({ ...product, qty, price: yourPrice }, e);
                    }
                  }}
                  disabled={!inStock}
                  className={`w-full h-9 rounded-xl font-extrabold text-sm tracking-wide transition-all duration-150 active:scale-98 cursor-pointer shadow-xs flex items-center justify-center gap-1.5 ${inStock
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed border-none'
                    }`}
                >
                  {inStock ? (
                    <>
                      <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                      <span>Add to Cart</span>
                    </>
                  ) : (
                    'Out of Stock'
                  )}
                </button>
              )}

              {/* Full Subscribe & Save Button (Styled like Add to Cart, no arrow icon) */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSubscribing(true);
                }}
                disabled={!inStock}
                className={`w-full h-9 rounded-xl font-extrabold text-sm tracking-wide transition-all duration-150 active:scale-98 cursor-pointer shadow-xs flex items-center justify-center border ${inStock
                  ? 'border-green-600 bg-green-50/70 hover:bg-green-600 text-green-700 hover:text-white shadow-green-600/10'
                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <span>Subscribe & Save</span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
