'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ArrowLeft, ShoppingCart, CalendarRange, Star, Truck, ShieldCheck, Clock } from 'lucide-react';

const fallbackImage = '/images/product-card-default.jpg';

export default function ProductDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgSrc, setImgSrc] = useState(fallbackImage);
  const [qty, setQty] = useState('1 kg');
  const [cartClicked, setCartClicked] = useState(false);

  // Subscription states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subFreq, setSubFreq] = useState('weekly');
  const [subQty, setSubQty] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState('Monday');

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
        };

        setProduct(normalized);
        setImgSrc(normalized.image);
        setQty(normalized.quantity);
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
      <div className="max-w-6xl mx-auto px-4 py-20 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif font-bold text-red-700 mb-4">{error || 'Product Not Found'}</h2>
        <button onClick={() => router.push('/products')} className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
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
      
      const existing = JSON.parse(localStorage.getItem('veggiemart_subscriptions') || '[]');
      existing.push(newSubscription);
      localStorage.setItem('veggiemart_subscriptions', JSON.stringify(existing));
      
      alert(`${data.message || `Successfully subscribed to ${product.name}!`} Wallet charged: Rs. ${Number(data.chargedAmount || newSubscription.price).toFixed(2)}.`);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message === 'Insufficient Wallet Balance' ? 'Insufficient Wallet Balance' : `Subscription failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button onClick={() => router.push('/products')} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm">
        {/* Left: Product Image */}
        <div className="flex items-center justify-center bg-gray-50/55 rounded-2xl p-6 relative aspect-square border border-gray-100/50">
          {pct > 0 && (
            <span className="absolute top-4 left-4 z-10 rounded-full bg-red-500 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
              {pct}% OFF
            </span>
          )}
          <img
            src={imgSrc}
            alt={product.name}
            className="max-h-[380px] object-contain transition-transform duration-300 hover:scale-105"
            onError={() => setImgSrc(fallbackImage)}
          />
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col gap-5 justify-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-wider">
              Category: {product.category || 'Fresh Produce'}
            </p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-gray-900">₹{yourPrice}</span>
            {mrp > yourPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{mrp}</span>
                <span className="text-sm font-bold text-green-600">Save ₹{saving} ({pct}% off)</span>
              </>
            )}
          </div>

          <div className="border-y border-gray-100 py-4 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-gray-700 w-24">Pack Size:</span>
              <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-md">{qty}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-gray-700 w-24">Availability:</span>
              <span className={`text-sm font-bold ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                {inStock ? 'In Stock (Farm Fresh)' : 'Out of Stock'}
              </span>
            </div>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed">
            {product.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <button
              onClick={() => {
                addToCart({ ...product, qty, price: yourPrice });
                setCartClicked(true);
                setTimeout(() => setCartClicked(false), 200);
              }}
              disabled={!inStock}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl text-sm font-bold transition hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md shadow-primary/10"
            >
              <ShoppingCart className="w-4 h-4" />
              {inStock ? (cartClicked ? 'Added!' : 'Add to Cart') : 'Out of Stock'}
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!inStock}
              className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-primary text-primary py-4 rounded-xl text-sm font-bold transition hover:bg-green-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <CalendarRange className="w-4 h-4" />
              Subscribe & Save
            </button>
          </div>

          {/* Delivery & Trust Badges */}
          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6 mt-2 text-center text-[11px] font-bold text-gray-500">
            <div className="flex flex-col items-center gap-1.5">
              <Truck className="w-5 h-5 text-primary" />
              <span>Next Day Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>100% Organic</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Clock className="w-5 h-5 text-primary" />
              <span>Direct Farm Pick</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full relative flex flex-col gap-4 border border-gray-100 shadow-2xl animate-fadeIn">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-600">×</button>
            <h3 className="text-xl font-bold text-gray-900 leading-tight">Wholesale Subscription</h3>
            <p className="text-xs text-gray-500 leading-relaxed -mt-2">Set up recurring fresh deliveries of {product.name}</p>
            
            {/* Product preview */}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
              <img src={imgSrc} alt={product.name} className="w-12 h-12 object-contain" />
              <div>
                <div className="text-xs font-bold text-gray-900 leading-tight">{product.name}</div>
                <div className="text-[11px] text-gray-400">Pack Size: {qty}</div>
                <div className="text-xs font-semibold text-gray-700 mt-0.5">₹{yourPrice} / pack</div>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">Quantity (Packs)</label>
              <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-xl self-start">
                <button onClick={() => setSubQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg border border-gray-200 bg-white font-bold">-</button>
                <span className="text-sm font-bold text-gray-900 min-w-[16px] text-center">{subQty}</span>
                <button onClick={() => setSubQty(q => q + 1)} className="w-8 h-8 rounded-lg border border-gray-200 bg-white font-bold">+</button>
              </div>
            </div>

            {/* Frequency */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">Delivery Frequency</label>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => setSubFreq('weekly')}
                  className={`border-2 rounded-xl p-3 cursor-pointer text-center transition-all ${subFreq === 'weekly' ? 'border-primary bg-green-50/50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="text-xs font-bold text-gray-900">Weekly</div>
                  <div className="text-[10px] font-semibold text-green-600 mt-0.5">Save 10% Extra</div>
                </div>
                <div 
                  onClick={() => setSubFreq('monthly')}
                  className={`border-2 rounded-xl p-3 cursor-pointer text-center transition-all ${subFreq === 'monthly' ? 'border-primary bg-green-50/50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="text-xs font-bold text-gray-900">Monthly</div>
                  <div className="text-[10px] font-semibold text-green-600 mt-0.5">Save 15% Extra</div>
                </div>
              </div>
            </div>

            {/* Preferred Delivery Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">Preferred Delivery Day / Date</label>
              <select
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white outline-none cursor-pointer"
              >
                {subFreq === 'weekly' ? (
                  <>
                    <option value="Monday">Monday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Friday">Friday</option>
                  </>
                ) : (
                  <>
                    <option value="1st of the month">1st of the month</option>
                    <option value="10th of the month">10th of the month</option>
                    <option value="20th of the month">20th of the month</option>
                  </>
                )}
              </select>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-[11px] text-gray-600 flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Base Price ({subQty} x ₹{yourPrice}):</span>
                <span>₹{yourPrice * subQty}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Sub Discount ({subFreq === 'weekly' ? '10%' : '15%'}):</span>
                <span>-₹{Math.round(yourPrice * subQty * (subFreq === 'weekly' ? 0.1 : 0.15))}</span>
              </div>
              <hr className="border-t border-dashed border-gray-200 my-1" />
              <div className="flex justify-between font-bold text-gray-900 text-xs">
                <span>Recurring Price:</span>
                <span className="text-green-600">₹{Math.round(yourPrice * subQty * (subFreq === 'weekly' ? 0.9 : 0.85))}</span>
              </div>
            </div>

            <button onClick={handleSubscribe} className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold transition hover:bg-primary-hover shadow-lg shadow-primary/20">
              Confirm Subscription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
